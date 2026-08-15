import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../core/theme.dart';

/// The form controls AddProperty.jsx and BuyerAssistance.jsx share.
///
/// Both pages style every field with the same inline rules rather than a CSS
/// class, so the tokens are transcribed here once:
///
///   border        1px solid #2F747F      (AppColors.tealDark)
///   background    #fff
///   border-radius 5px  (select buttons) / .25rem "rounded-1" (inputs)
///   colour        #2F747F on the select button, default ink inside inputs
///   input         padding 8px, font-size 14px, no border, no outline
///   select button padding 10px, text-align left, leading icon + 10px gap
///
/// The label sits above the control as a plain `<label>`, with a red asterisk
/// when the field is in `requiredFieldsByStep`.

const Color _fieldBorder = AppColors.tealDark; // #2F747F
const double _selectRadius = 5;
const double _inputRadius = 4; // Bootstrap .rounded-1 = .25rem

/// `<label>Name <span style={{color:'red'}}>*</span></label>`
class WebFieldLabel extends StatelessWidget {
  const WebFieldLabel(this.label, {super.key, this.required = false});

  final String label;
  final bool required;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: RichText(
        text: TextSpan(
          text: label,
          style: const TextStyle(fontSize: 16, color: Color(0xFF212529)),
          children: required
              ? const [
                  TextSpan(text: ' *', style: TextStyle(color: Colors.red)),
                ]
              : const [],
        ),
      ),
    );
  }
}

/// A bordered text/number input with an optional leading icon, matching the
/// web's `.input-card` wrapper around a borderless `<input>`.
class WebTextField extends StatelessWidget {
  const WebTextField({
    super.key,
    required this.label,
    required this.value,
    required this.onChanged,
    this.required = false,
    this.hint,
    this.icon,
    this.maxLines = 1,
    this.numeric = false,
    this.keyboard,
  });

  final String label;
  final String? value;
  final ValueChanged<String> onChanged;
  final bool required;
  final String? hint;
  final IconData? icon;
  final int maxLines;
  final bool numeric;
  final TextInputType? keyboard;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          WebFieldLabel(label, required: required),
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border.all(color: _fieldBorder),
              borderRadius: BorderRadius.circular(_inputRadius),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                if (icon != null)
                  Padding(
                    padding: const EdgeInsets.only(left: 10),
                    child: Icon(icon, size: 16, color: _fieldBorder),
                  ),
                Expanded(
                  child: TextFormField(
                    initialValue: value,
                    maxLines: maxLines,
                    keyboardType: keyboard ??
                        (numeric ? TextInputType.number : TextInputType.text),
                    inputFormatters:
                        numeric ? [FilteringTextInputFormatter.digitsOnly] : null,
                    style: const TextStyle(fontSize: 14),
                    decoration: InputDecoration(
                      hintText: hint,
                      hintStyle: const TextStyle(
                        fontSize: 14,
                        color: AppColors.textFaint,
                      ),
                      // border: none / outline: none — the wrapper draws it.
                      isDense: true,
                      filled: false,
                      contentPadding: const EdgeInsets.all(8),
                      border: InputBorder.none,
                      enabledBorder: InputBorder.none,
                      focusedBorder: InputBorder.none,
                    ),
                    onChanged: onChanged,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// The web hides the real `<select>` and renders a left-aligned button that
/// opens a custom dropdown. This is that button plus a modal option list.
class WebDropdownField extends StatelessWidget {
  const WebDropdownField({
    super.key,
    required this.label,
    required this.value,
    required this.options,
    required this.onChanged,
    required this.placeholder,
    this.required = false,
    this.icon,
  });

  final String label;
  final String? value;
  final List<String> options;
  final ValueChanged<String?> onChanged;
  final String placeholder;
  final bool required;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final selected = (value != null && value!.trim().isNotEmpty) ? value : null;

    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          WebFieldLabel(label, required: required),
          InkWell(
            onTap: options.isEmpty ? null : () => _pick(context),
            borderRadius: BorderRadius.circular(_selectRadius),
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border.all(color: _fieldBorder),
                borderRadius: BorderRadius.circular(_selectRadius),
              ),
              child: Row(
                children: [
                  Icon(icon ?? Icons.home_outlined, size: 16, color: _fieldBorder),
                  const SizedBox(width: 10), // span { margin-right: 10px }
                  Expanded(
                    child: Text(
                      selected ?? placeholder,
                      style: const TextStyle(fontSize: 14, color: _fieldBorder),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const Icon(Icons.arrow_drop_down, size: 20, color: _fieldBorder),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _pick(BuildContext context) async {
    final picked = await showModalBottomSheet<String>(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(14)),
      ),
      builder: (sheetContext) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 8),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      label,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        color: _fieldBorder,
                        fontSize: 15,
                      ),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, size: 20),
                    onPressed: () => Navigator.pop(sheetContext),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),
            Flexible(
              child: ListView.builder(
                shrinkWrap: true,
                itemCount: options.length,
                itemBuilder: (_, i) {
                  final option = options[i];
                  final isSelected = option == value;
                  return ListTile(
                    dense: true,
                    title: Text(
                      option,
                      style: TextStyle(
                        fontSize: 14,
                        color: isSelected ? _fieldBorder : null,
                        fontWeight: isSelected ? FontWeight.w700 : null,
                      ),
                    ),
                    trailing: isSelected
                        ? const Icon(Icons.check, size: 18, color: _fieldBorder)
                        : null,
                    onTap: () => Navigator.pop(sheetContext, option),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
    if (picked != null) onChanged(picked);
  }
}
