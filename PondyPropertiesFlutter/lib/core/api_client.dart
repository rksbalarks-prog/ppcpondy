import 'package:dio/dio.dart';

import 'city_base.dart';
import 'config.dart';

/// Thin Dio wrapper around the PPC backend.
///
/// Mirrors the web app's axios setup:
///  * base URL = REACT_APP_API_URL
///  * a request interceptor that appends `base=PY|CH` to every call so the
///    backend's cityScopePlugin returns the right city's data
///  * errors surface as [ApiException] carrying the server's message, which is
///    what the React screens read out of `error.response.data.message`.
class ApiClient {
  ApiClient._internal() {
    _dio = Dio(
      BaseOptions(
        baseUrl: AppConfig.apiUrl,
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 60),
        sendTimeout: const Duration(minutes: 5), // photo/video uploads
        // Let us handle non-2xx ourselves so we can read the server message.
        validateStatus: (status) => status != null && status < 500,
        headers: {'Accept': 'application/json'},
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          // City-base tagging — the Flutter equivalent of
          // registerBaseInterceptor() in utils/cityBase.js.
          options.queryParameters = {
            ...options.queryParameters,
            'base': CityBase.active,
          };
          handler.next(options);
        },
      ),
    );
  }

  static final ApiClient instance = ApiClient._internal();

  late final Dio _dio;

  Dio get dio => _dio;

  Future<dynamic> get(String path, {Map<String, dynamic>? query}) async {
    final res = await _dio.get(path, queryParameters: query);
    return _unwrap(res);
  }

  Future<dynamic> post(String path, {dynamic data, Map<String, dynamic>? query}) async {
    final res = await _dio.post(path, data: data, queryParameters: query);
    return _unwrap(res);
  }

  Future<dynamic> put(String path, {dynamic data, Map<String, dynamic>? query}) async {
    final res = await _dio.put(path, data: data, queryParameters: query);
    return _unwrap(res);
  }

  Future<dynamic> delete(String path, {dynamic data, Map<String, dynamic>? query}) async {
    final res = await _dio.delete(path, data: data, queryParameters: query);
    return _unwrap(res);
  }

  /// Multipart POST (add / update property, photo uploads).
  Future<dynamic> postMultipart(String path, FormData form) async {
    final res = await _dio.post(
      path,
      data: form,
      options: Options(contentType: 'multipart/form-data'),
    );
    return _unwrap(res);
  }

  dynamic _unwrap(Response res) {
    final status = res.statusCode ?? 0;
    if (status >= 200 && status < 300) return res.data;
    throw ApiException(
      _messageOf(res.data) ?? 'Request failed (HTTP $status)',
      statusCode: status,
      data: res.data,
    );
  }

  static String? _messageOf(dynamic body) {
    if (body is Map) {
      for (final key in ['message', 'error', 'msg']) {
        final v = body[key];
        if (v is String && v.trim().isNotEmpty) return v;
      }
    }
    if (body is String && body.trim().isNotEmpty && !body.contains('<html')) {
      return body;
    }
    return null;
  }
}

/// Error carrying the backend's own message so screens can show it verbatim.
class ApiException implements Exception {
  ApiException(this.message, {this.statusCode, this.data});

  final String message;
  final int? statusCode;
  final dynamic data;

  @override
  String toString() => message;
}

/// Turn any thrown object into something worth showing a user.
String describeError(Object error) {
  if (error is ApiException) return error.message;
  if (error is DioException) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.receiveTimeout:
      case DioExceptionType.sendTimeout:
        return 'The server took too long to respond. Please try again.';
      case DioExceptionType.connectionError:
        return 'No internet connection.';
      default:
        final msg = ApiClient._messageOf(error.response?.data);
        return msg ?? 'Something went wrong. Please try again.';
    }
  }
  return 'Something went wrong. Please try again.';
}
