import React, { useState, useEffect, useRef } from "react";
import {
  saveDraft,
  loadDraft,
  clearDraft,
  isDraftMeaningful,
  DRAFT_TTL_MS,
} from "./utils/addPropertyDraft";
import axios from "axios";
import { Button } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import { RiLayoutLine } from "react-icons/ri";
import {
  TbArrowLeftRight,
  TbMapPinCode,
  TbWorldLongitude,
} from "react-icons/tb";
import {
  FaBath,
  FaChartArea,
  FaPhone,
  FaEdit,
  FaHome,
  FaUserAlt,
  FaEnvelope,
  FaRupeeSign,
  FaFileVideo,
  FaToilet,
  FaCar,
  FaBed,
  FaCity,
  FaTimes,
} from "react-icons/fa";
import { FaRegAddressCard, FaCheck } from "react-icons/fa6";
import {
  MdLocationOn,
  MdOutlineMeetingRoom,
  MdOutlineOtherHouses,
  MdSchedule,
  MdStraighten,
  MdApproval,
  MdLocationCity,
  MdAddPhotoAlternate,
  MdOutlineClose,
} from "react-icons/md";
import {
  BsBank,
  BsBuildingsFill,
  BsFillHouseCheckFill,
  BsTextareaT,
} from "react-icons/bs";
import {
  GiKitchenScale,
  GiMoneyStack,
  GiResize,
  GiGears,
} from "react-icons/gi";
import { HiUserGroup } from "react-icons/hi";
import { BiBuildingHouse, BiWorld } from "react-icons/bi";
import { IoCloseCircle } from "react-icons/io5";
import moment from "moment";
import { useSelector } from "react-redux";
import { toWords } from "number-to-words";
import { FcSearch } from "react-icons/fc";

function AddProperty() {
  const location = useLocation();
  const [ppcId, setPpcId] = useState(location.state?.ppcId || "");
  const [selectedFiles, setSelectedFiles] = useState([]); // Store selected files

  const inputRef = useRef(null);
  const latRef = useRef(null);
  const lngRef = useRef(null);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);
  const coordRef = useRef(null);

  const [priceInWords, setPriceInWords] = useState("");

  const [formData, setFormData] = useState({
    propertyMode: "",
    propertyType: "",
    price: "",
    priceData: "",
    propertyAge: "",
    bankLoan: "",
    negotiation: "",
    length: "",
    breadth: "",
    totalArea: "",
    ownership: "",
    bedrooms: "",
    kitchen: "",
    balconies: "",
    floorNo: "",
    areaUnit: "",
    propertyApproved: "",
    postedBy: "",
    facing: "",
    salesMode: "",
    salesType: "",
    description: "",
    furnished: "",
    lift: "",
    attachedBathrooms: "",
    western: "",
    numberOfFloors: "",
    carParking: "",
    country: "",
    state: "",
    city: "",
    district: "",
    area: "",
    streetName: "",
    doorNumber: "",
    nagar: "",
    ownerName: "",
    email: "",
    phoneNumber: "",
    phoneNumberCountryCode: "",
    alternatePhone: "",
    alternatePhoneCountryCode: "",
    bestTimeToCall: "",
    pinCode: "",
    locationCoordinates: "",
  });
  const [photos, setPhotos] = useState([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [video, setVideo] = useState(null);
  const [coordinateInput, setCoordinateInput] = useState("");
  const [videos, setVideos] = useState([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadingVideos, setUploadingVideos] = useState(false);

  // ── Draft auto-save ────────────────────────────────────────────────────
  // pendingDraft holds a previously-saved draft until the user clicks
  // Restore or Discard. While it's non-null we don't auto-save (otherwise
  // we'd immediately overwrite the saved draft with the current blank
  // form). draftReady gates the auto-save effect so it doesn't fire on
  // initial mount before we've checked for a saved draft.
  const [pendingDraft, setPendingDraft] = useState(null);
  const [draftReady, setDraftReady] = useState(false);
  const [draftStatus, setDraftStatus] = useState(""); // small UI hint

  // On mount: see if a draft exists from a previous session.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const draft = await loadDraft();
      if (cancelled) return;
      if (isDraftMeaningful(draft)) {
        setPendingDraft(draft);
      } else {
        // No meaningful draft — clear any junk and start auto-saving.
        if (draft) await clearDraft();
        setDraftReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleRestoreDraft = () => {
    if (!pendingDraft) return;
    if (pendingDraft.formData) {
      setFormData((prev) => ({ ...prev, ...pendingDraft.formData }));
    }
    if (Array.isArray(pendingDraft.photos)) {
      setPhotos(pendingDraft.photos);
    }
    if (Array.isArray(pendingDraft.videos)) {
      setVideos(pendingDraft.videos);
    }
    if (typeof pendingDraft.selectedPhotoIndex === "number") {
      setSelectedPhotoIndex(pendingDraft.selectedPhotoIndex);
    }
    if (pendingDraft.ppcId) {
      setPpcId(pendingDraft.ppcId);
    }
    setPendingDraft(null);
    setDraftReady(true);
    setDraftStatus("Draft restored");
  };

  const handleDiscardDraft = async () => {
    await clearDraft();
    setPendingDraft(null);
    setDraftReady(true);
    setDraftStatus("");
  };

  // Auto-expire the restore prompt. If the user neither restores nor discards
  // a found draft, clear it automatically once it crosses the TTL (measured
  // from when it was last saved). This stops a stale draft from lingering on a
  // shared PC or in an abandoned second tab.
  useEffect(() => {
    if (!pendingDraft) return;
    const savedTime = pendingDraft.savedAt
      ? new Date(pendingDraft.savedAt).getTime()
      : Date.now();
    const remaining = DRAFT_TTL_MS - (Date.now() - savedTime);
    const timer = setTimeout(() => {
      handleDiscardDraft();
    }, Math.max(0, remaining));
    return () => clearTimeout(timer);
  }, [pendingDraft]);

  // Auto-save (debounced ~800 ms). Only runs once draftReady is true,
  // i.e. after the user has decided what to do with any prior draft.
  useEffect(() => {
    if (!draftReady) return;

    const meaningful =
      photos.length > 0 ||
      videos.length > 0 ||
      Object.values(formData).some(
        (v) => v !== "" && v !== null && v !== undefined
      );

    if (!meaningful) return;

    const timer = setTimeout(async () => {
      const ok = await saveDraft({
        formData,
        photos,
        videos,
        selectedPhotoIndex,
        ppcId,
      });
      if (ok) {
        const ts = new Date().toLocaleTimeString();
        setDraftStatus(`Draft auto-saved at ${ts}`);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [
    draftReady,
    formData,
    photos,
    videos,
    selectedPhotoIndex,
    ppcId,
  ]);

  useEffect(() => {
    if (!window.google) return;

    const interval = setInterval(() => {
      if (mapRef.current && inputRef.current) {
        clearInterval(interval);

        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: 11.9416, lng: 79.8083 },
          zoom: 10,
        });

        mapInstance.current = map;
        // ✅ Add click listener on the map
        const geocoder = new window.google.maps.Geocoder();
        map.addListener("click", (e) => {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();

          updateMap(lat, lng); // optional: show marker

          geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === "OK" && results[0]) {
              const place = results[0];

              const getComponent = (type) => {
                const comp = place.address_components?.find((c) =>
                  c.types.includes(type),
                );
                return comp?.long_name || "";
              };

              setFormData((prev) => ({
                ...prev,
                latitude: lat,
                longitude: lng,
                pinCode: getComponent("postal_code"),
                city: getComponent("sublocality_level_1"),
                area: getComponent("sublocality_level_2"),
                nagar: getComponent("sublocality"),
                streetName: getComponent("route") || getComponent("premise"),
                district:
                  getComponent("administrative_area_level_2") ||
                  getComponent("locality"),
                state: getComponent("administrative_area_level_1"),
                country: getComponent("country"),
                doorNumber: getComponent("street_number"),
                locationCoordinates: `${lat.toFixed(6)}° N, ${lng.toFixed(6)}° E`, // ✅ Add this
              }));
            }
          });
        });

        const autocomplete = new window.google.maps.places.Autocomplete(
          inputRef.current,
          {
            types: ["geocode"],
          },
        );

        autocomplete.bindTo("bounds", map);

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (!place.geometry || !place.geometry.location) return;

          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();

          updateMap(lat, lng);

          const getComponent = (type) => {
            const comp = place.address_components?.find((c) =>
              c.types.includes(type),
            );
            return comp?.long_name || "";
          };

          setFormData((prev) => ({
            ...prev,
            latitude: lat,
            longitude: lng,
            pinCode: getComponent("postal_code"),
            city:
              getComponent("locality") ||
              getComponent("administrative_area_level_2"),
            area:
              getComponent("sublocality") ||
              getComponent("sublocality_level_1"),
            streetName: getComponent("route") || getComponent("premise"),
            district: getComponent("administrative_area_level_2"),
            state: getComponent("administrative_area_level_1"),
            country: getComponent("country"),
            doorNumber: getComponent("street_number"), // ✅ added here
            locationCoordinates: `${lat.toFixed(6)}° N, ${lng.toFixed(6)}° E`, // ✅ Add this
          }));
        });
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const updateMap = (lat, lng) => {
    const map = mapInstance.current;
    if (!map) return;

    map.setCenter({ lat, lng });
    map.setZoom(12);

    const position = { lat, lng };

    const geocoder = new window.google.maps.Geocoder();

    if (markerRef.current) {
      markerRef.current.setPosition(position);
    } else {
      markerRef.current = new window.google.maps.Marker({
        position,
        map,
        draggable: true,
      });

      // ✅ Listen to dragend event only once when marker is created
      markerRef.current.addListener("dragend", (e) => {
        const newLat = e.latLng.lat();
        const newLng = e.latLng.lng();

        // Update map and form on drag end
        geocoder.geocode(
          { location: { lat: newLat, lng: newLng } },
          (results, status) => {
            if (status === "OK" && results[0]) {
              const place = results[0];
              const getComponent = (type) => {
                const comp = place.address_components?.find((c) =>
                  c.types.includes(type),
                );
                return comp?.long_name || "";
              };

              setFormData((prev) => ({
                ...prev,
                latitude: newLat,
                longitude: newLng,
                pinCode: getComponent("postal_code"),
                city: getComponent("sublocality_level_1"),
                area: getComponent("sublocality_level_2"),
                nagar: getComponent("sublocality"),
                streetName: getComponent("route") || getComponent("premise"),
                district:
                  getComponent("administrative_area_level_2") ||
                  getComponent("locality"),
                state: getComponent("administrative_area_level_1"),
                country: getComponent("country"),
                doorNumber: getComponent("street_number"),
                locationCoordinates: `${newLat.toFixed(6)}° N, ${newLng.toFixed(6)}° E`,
              }));
            }
          },
        );
      });
    }
  };
  const handleLatLngSearch = (e) => {
    e.preventDefault();

    const lat = parseFloat(latRef.current.value);
    const lng = parseFloat(lngRef.current.value);

    if (!isNaN(lat) && !isNaN(lng)) {
      updateMap(lat, lng);

      const geocoder = new window.google.maps.Geocoder();
      const latlng = { lat, lng };

      geocoder.geocode({ location: latlng }, (results, status) => {
        if (status === "OK" && results[0]) {
          const place = results[0];

          const getComponent = (type) => {
            const comp = place.address_components.find((c) =>
              c.types.includes(type),
            );
            return comp?.long_name || "";
          };

          setFormData((prev) => ({
            ...prev,
            latitude: lat,
            longitude: lng,
            pinCode: getComponent("postal_code"),
            city:
              getComponent("locality") ||
              getComponent("administrative_area_level_3"),
            area:
              getComponent("sublocality") ||
              getComponent("sublocality_level_1"),
            streetName: getComponent("route") || getComponent("premise"),
            district: getComponent("administrative_area_level_2"),
            state: getComponent("administrative_area_level_1"),
            country: getComponent("country"),
            doorNumber: getComponent("street_number"), // ✅ added here
            locationCoordinates: `${lat.toFixed(6)}° N, ${lng.toFixed(6)}° E`, // ✅ Add this
          }));
        } else {
          alert("Reverse geocoding failed: " + status);
        }
      });
    } else {
      alert("Enter valid coordinates");
    }
  };
  const [coordValue, setCoordValue] = useState("");

  const handleLatLngAuto = (input) => {
    input = input.trim();

    const matchDecimalDir = input.match(
      /([-\d.]+)[^\dNS]*([NS]),?\s*([-\d.]+)[^\dEW]*([EW])/i,
    );

    let lat, lng;

    if (matchDecimalDir) {
      lat = parseFloat(matchDecimalDir[1]);
      const latDir = matchDecimalDir[2].toUpperCase();
      lng = parseFloat(matchDecimalDir[3]);
      const lngDir = matchDecimalDir[4].toUpperCase();

      if (latDir === "S") lat = -lat;
      if (lngDir === "W") lng = -lng;
    } else {
      // 2. Match DMS (e.g., 11°55'13.3"N 79°47'24.2"E)
      const dmsRegex =
        /(\d+)[°:\s](\d+)[\'′:\s](\d+(?:\.\d+)?)[\"\″]?\s*([NS])[^0-9]*(\d+)[°:\s](\d+)[\'′:\s](\d+(?:\.\d+)?)[\"\″]?\s*([EW])/i;
      const dmsMatch = input.match(dmsRegex);

      if (dmsMatch) {
        const [
          _full,
          latDeg,
          latMin,
          latSec,
          latDir,
          lngDeg,
          lngMin,
          lngSec,
          lngDir,
        ] = dmsMatch;

        lat = dmsToDecimal(+latDeg, +latMin, +latSec, latDir.toUpperCase());
        lng = dmsToDecimal(+lngDeg, +lngMin, +lngSec, lngDir.toUpperCase());
      } else {
        // 3. Match plain decimal format: "11.778068, 79.735691"
        const plainDecimal = input.match(/([-\d.]+)[,\s]+([-\d.]+)/);
        if (plainDecimal) {
          lat = parseFloat(plainDecimal[1]);
          lng = parseFloat(plainDecimal[2]);
        } else {
          return; // No valid format matched
        }
      }
    }

    if (!isNaN(lat) && !isNaN(lng)) {
      updateMap(lat, lng);

      const geocoder = new window.google.maps.Geocoder();
      const latlng = { lat, lng };

      geocoder.geocode({ location: latlng }, (results, status) => {
        if (status === "OK" && results[0]) {
          const place = results[0];

          const getComponent = (type) => {
            const comp = place.address_components.find((c) =>
              c.types.includes(type),
            );
            return comp?.long_name || "";
          };

          setFormData((prev) => ({
            ...prev,
            // rentalPropertyAddress: place.formatted_address,
            latitude: lat,
            longitude: lng,
            pinCode: getComponent("postal_code"),
            city:
              getComponent("locality") ||
              getComponent("administrative_area_level_3"),
            area:
              getComponent("sublocality") ||
              getComponent("sublocality_level_1"),
            streetName: getComponent("route") || getComponent("premise"),
            district: getComponent("administrative_area_level_2"),
            state: getComponent("administrative_area_level_1"),
            country: getComponent("country"),
            doorNumber: getComponent("street_number"),
            locationCoordinates: `${lat.toFixed(6)}° N, ${lng.toFixed(6)}° E`,
          }));
        }
      });
    }
  };
  const dmsToDecimal = (deg, min, sec, direction) => {
    let decimal = deg + min / 60 + sec / 3600;
    if (["S", "W"].includes(direction)) decimal = -decimal;
    return decimal;
  };
  const handleClear = () => {
    if (coordRef.current) {
      coordRef.current.value = ""; // Clear the actual input field
    }
    setCoordValue(""); // Reset state if needed

    // Reset formData fields
    setFormData((prev) => ({
      ...prev,
      // rentalPropertyAddress: '',
      latitude: "",
      longitude: "",
      pinCode: "",
      city: "",
      area: "",
      nagar: "",
      streetName: "",
      district: "",
      state: "",
      country: "",
      doorNumber: "",
      locationCoordinates: "",
    }));
  };

  const reduxAdminName = useSelector((state) => state.admin.name);
  const reduxAdminRole = useSelector((state) => state.admin.role);

  const adminName = reduxAdminName || localStorage.getItem("adminName");
  const adminRole = reduxAdminRole || localStorage.getItem("adminRole");

  const [allowedRoles, setAllowedRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fileName = "Add Property"; // current file

  // Sync Redux to localStorage
  useEffect(() => {
    if (reduxAdminName) localStorage.setItem("adminName", reduxAdminName);
    if (reduxAdminRole) localStorage.setItem("adminRole", reduxAdminRole);
  }, [reduxAdminName, reduxAdminRole]);

  // Record dashboard view
  useEffect(() => {
    const recordDashboardView = async () => {
      try {
        await axios.post(`${process.env.REACT_APP_API_URL}/record-view`, {
          userName: adminName,
          role: adminRole,
          viewedFile: fileName,
          viewTime: moment().format("YYYY-MM-DD HH:mm:ss"),
        });
      } catch (err) {}
    };

    if (adminName && adminRole) {
      recordDashboardView();
    }
  }, [adminName, adminRole]);

  // Fetch role-based permissions
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/get-role-permissions`,
        );
        const rolePermissions = res.data.find(
          (perm) => perm.role === adminRole,
        );
        const viewed = rolePermissions?.viewedFiles?.map((f) => f.trim()) || [];
        setAllowedRoles(viewed);
      } catch (err) {
      } finally {
        setLoading(false);
      }
    };

    if (adminRole) {
      fetchPermissions();
    }
  }, [adminRole]);

  const [dropdownState, setDropdownState] = useState({
    activeDropdown: null,
    filterText: "",
  });

  // Toggle dropdown visibility
  const toggleDropdown = (field) => {
    setDropdownState((prevState) => ({
      activeDropdown: prevState.activeDropdown === field ? null : field,
      filterText: "",
    }));
  };

  // Handle dropdown selection
  const handleDropdownSelect = (field, value) => {
    setFormData((prevState) => ({ ...prevState, [field]: value }));
    setDropdownState({ activeDropdown: null, filterText: "" });
  };

  // Handle filter input change for dropdown
  const handleFilterChange = (e) => {
    setDropdownState((prevState) => ({
      ...prevState,
      filterText: e.target.value,
    }));
  };

  const [countryCodes, setCountryCodes] = useState([
    { code: "+1", country: "USA/Canada" },
    { code: "+44", country: "UK" },
    { code: "+91", country: "India" },
    { code: "+61", country: "Australia" },
    { code: "+81", country: "Japan" },
    { code: "+49", country: "Germany" },
    { code: "+33", country: "France" },
    { code: "+34", country: "Spain" },
    { code: "+55", country: "Brazil" },
    { code: "+52", country: "Mexico" },
    { code: "+86", country: "China" },
    { code: "+39", country: "Italy" },
    { code: "+7", country: "Russia/Kazakhstan" },
    // ... other countries
  ]);
  const [alternateCountryCodes, setAlternateCountryCodes] = useState([
    { code: "+1", country: "USA/Canada" },
    { code: "+44", country: "UK" },
    { code: "+91", country: "India" },
    { code: "+61", country: "Australia" },
    { code: "+81", country: "Japan" },
    { code: "+49", country: "Germany" },
    { code: "+33", country: "France" },
    { code: "+34", country: "Spain" },
    { code: "+55", country: "Brazil" },
    { code: "+52", country: "Mexico" },
    { code: "+86", country: "China" },
    { code: "+39", country: "Italy" },
    { code: "+7", country: "Russia/Kazakhstan" },
  ]);

  const [dataList, setDataList] = useState({});

  const fetchDropdownData = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/fetch`,
      );
      const groupedData = response.data.data.reduce((acc, item) => {
        if (!acc[item.field]) acc[item.field] = [];
        acc[item.field].push(item.value);
        return acc;
      }, {});
      setDataList(groupedData);
    } catch (error) {}
  };

  useEffect(() => {
    fetchDropdownData();
  }, []);

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    const maxSize = 50 * 1024 * 1024; // 10MB

    if (!files.length) return;

    // Check size
    for (let file of files) {
      if (file.size > maxSize) {
        alert("File size exceeds the 10MB limit");
        return;
      }
    }

    // Check total photo count
    if (photos.length + files.length > 15) {
      alert("Maximum 15 photos can be uploaded.");
      return;
    }

    setUploadingPhotos(true);

    const watermarkedImages = await Promise.all(
      files.map((file) => {
        return new Promise((resolve) => {
          const reader = new FileReader();

          reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement("canvas");
              const ctx = canvas.getContext("2d");

              canvas.width = img.width;
              canvas.height = img.height;

              ctx.drawImage(img, 0, 0);

              // Watermark settings
              const watermarkText = "PPC Pondy";
              const fontSize = Math.max(24, Math.floor(canvas.width / 15));
              ctx.font = `bold ${fontSize}px Arial`;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";

              const centerX = canvas.width / 2;
              const centerY = canvas.height / 2;

              // White outline
              ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
              ctx.lineWidth = 4;
              ctx.strokeText(watermarkText, centerX, centerY);

              // Black fill
              ctx.fillStyle = "rgba(224, 223, 223, 0.9)";
              ctx.fillText(watermarkText, centerX, centerY);

              canvas.toBlob(
                (blob) => {
                  const watermarkedFile = new File([blob], file.name, {
                    type: file.type,
                  });
                  resolve(watermarkedFile);
                },
                file.type,
                0.8,
              );
            };

            img.src = event.target.result;
          };

          reader.readAsDataURL(file);
        });
      }),
    );

    setPhotos([...photos, ...watermarkedImages]);
    setSelectedFiles(watermarkedImages);
    setSelectedPhotoIndex(0);
    setUploadingPhotos(false);
  };
  const removePhoto = (index) => {
    setPhotos(photos.filter((_, i) => i !== index));
    // Keep the "default" pointer on the same photo after the list reflows.
    if (index === selectedPhotoIndex) {
      setSelectedPhotoIndex(0);
    } else if (index < selectedPhotoIndex) {
      setSelectedPhotoIndex(selectedPhotoIndex - 1);
    }
  };

  const handleVideoChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const maxSize = 100 * 1024 * 1024; // 50MB
    const validFiles = [];

    for (let file of selectedFiles) {
      if (file.size > maxSize) {
        alert(`${file.name} exceeds the 50MB size limit.`);
        continue;
      }
      validFiles.push(file);
    }

    // Allow up to 5 videos
    const totalFiles = [...videos, ...validFiles].slice(0, 5);
    setUploadingVideos(true);
    setVideos(totalFiles);
    setUploadingVideos(false);
  };

  const removeVideo = (indexToRemove) => {
    setVideos((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handlePhotoSelect = (index) => {
    setSelectedPhotoIndex(index);
  };

  const convertToIndianRupees = (num) => {
    const number = parseInt(num, 10);
    if (isNaN(number)) return "";

    if (number >= 10000000) {
      return (number / 10000000).toFixed(2).replace(/\.00$/, "") + " crores";
    } else if (number >= 100000) {
      return (number / 100000).toFixed(2).replace(/\.00$/, "") + " lakhs";
    } else {
      return (
        toWords(number).replace(/\b\w/g, (l) => l.toUpperCase()) + " rupees"
      );
    }
  };

  const handleFieldChange = (e) => {
    const { name, value } = e.target;

    // If the field is 'price', update priceInWords accordingly
    if (name === "price") {
      if (value !== "" && !isNaN(value)) {
        setPriceInWords(convertToIndianRupees(value));
      } else {
        setPriceInWords("");
      }
    }

    // Set formData as before, ensuring price is a number
    setFormData((prevState) => ({
      ...prevState,
      [name]: name === "price" ? Number(value) || 0 : value,
    }));
  };

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    const isValid = requiredFields.every(
      (field) => formData[field] && formData[field].toString().trim() !== "",
    );
    if (!isValid) {
      alert("Please fill all mandatory fields.");
      return;
    }

    try {
      let newPpcId = ppcId; // Use existing PPC-ID if available

      // 🔹 Generate PPC-ID only if it's not already stored
      if (!newPpcId) {
        const response = await axios.post(
          `${process.env.REACT_APP_API_URL}/store-id`,
        );
        if (response.status === 201 && response.data.ppcId) {
          newPpcId = response.data.ppcId;
          setPpcId(newPpcId);
          localStorage.setItem("ppcId", newPpcId); // 🔥 Store PPC-ID in localStorage
        } else {
          alert("Failed to generate PPC-ID. Please try again.");
          return;
        }
      }

      // 🔹 Create FormData instance for file uploads
      const formDataToSend = new FormData();

      // Append PPC-ID (existing or newly generated)
      formDataToSend.append("ppcId", newPpcId);

      // Note: status is intentionally NOT sent here. The /update-property
      // route computes it server-side via an isComplete check on the
      // required fields and writes "complete" or "incomplete". Sending
      // "Complete" (capital C) used to fail Mongoose enum validation.

      // Stamp the logged-in admin who is adding this property
      if (adminName) {
        formDataToSend.append("addedBy", adminName);
        formDataToSend.append("addedByRole", adminRole || "");
        formDataToSend.append("addedAt", new Date().toISOString());
      }

      // Append form fields
      Object.keys(formData).forEach((key) => {
        if (formData[key]) {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Append photos
      const reorderedPhotos =
        selectedPhotoIndex >= 0 && selectedPhotoIndex < photos.length
          ? [
              photos[selectedPhotoIndex],
              ...photos.filter((_, i) => i !== selectedPhotoIndex),
            ]
          : photos;
      reorderedPhotos.forEach((photo) => {
        formDataToSend.append("photos", photo);
      });

      // Append video if available
      videos.forEach((file) => {
        formDataToSend.append("video", file); // <== field name matches backend multer: 'video'
      });

      // 🔹 Submit the property update request (update if PPC-ID exists)
      const propertyResponse = await axios.post(
        `${process.env.REACT_APP_API_URL}/update-property`,
        formDataToSend,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      alert(propertyResponse.data.message);
      // Submission succeeded — the property is on the server now, so the
      // local draft is stale. Wipe it so the next visit starts clean.
      await clearDraft();
      navigate("/dashboard/preapproved-car");
    } catch (error) {
      alert("An error occurred while submitting the property data.");
    }
  };

  useEffect(() => {
    const storedPpcId = localStorage.getItem("ppcId");

    if (!storedPpcId) {
      localStorage.removeItem("ppcId"); // Reset PPC-ID when user leaves and returns
    }
  }, []);

  const fieldIcons = {
    // Contact Details
    phoneNumber: <FaPhone color="#2F747F" />,
    alternatePhone: <FaPhone color="#2F747F" />,
    email: <FaEnvelope color="#2F747F" />,
    bestTimeToCall: <MdSchedule color="#2F747F" />,

    // Property Location
    // rentalPropertyAddress: <MdLocationCity color="#2F747F" />,
    country: <BiWorld color="#2F747F" />,
    state: <MdLocationCity color="#2F747F" />,
    city: <FaCity color="#2F747F" />,
    district: <FaRegAddressCard color="#2F747F" />,
    area: <MdLocationOn color="#2F747F" />,
    streetName: <RiLayoutLine color="#2F747F" />,
    doorNumber: <BiBuildingHouse color="#2F747F" />,
    nagar: <FaRegAddressCard color="#2F747F" />,

    // Ownership & Posting Info
    ownerName: <FaUserAlt color="#2F747F" />,
    postedBy: <FaUserAlt color="#2F747F" />,
    ownership: <HiUserGroup color="#2F747F" />,

    // Property Details
    propertyMode: <MdApproval color="#2F747F" />,
    propertyType: <MdOutlineOtherHouses color="#2F747F" />,
    propertyApproved: <BsFillHouseCheckFill color="#2F747F" />,
    propertyAge: <MdSchedule color="#2F747F" />,
    description: <BsTextareaT color="#2F747F" />,

    // Pricing & Financials
    price: <FaRupeeSign color="#2F747F" />,
    bankLoan: <BsBank color="#2F747F" />,
    negotiation: <GiMoneyStack color="#2F747F" />,

    // Measurements
    length: <MdStraighten color="#2F747F" />,
    breadth: <MdStraighten color="#2F747F" />,
    totalArea: <GiResize color="#2F747F" />,
    areaUnit: <FaChartArea color="#2F747F" />,

    // Room & Floor Details
    bedrooms: <FaBed color="#2F747F" />,
    kitchen: <GiKitchenScale color="#2F747F" />,
    // kitchenType: <GiKitchenScale color="#2F747F" />,
    balconies: <MdOutlineMeetingRoom color="#2F747F" />,
    floorNo: <BsBuildingsFill color="#2F747F" />,
    numberOfFloors: <BsBuildingsFill color="#2F747F" />,
    attachedBathrooms: <FaBath color="#2F747F" />,
    western: <FaToilet color="#2F747F" />,

    // Features & Amenities
    facing: <TbArrowLeftRight color="#2F747F" />,
    salesMode: <GiGears color="#2F747F" />,
    salesType: <MdOutlineOtherHouses color="#2F747F" />,
    furnished: <FaHome color="#2F747F" />,
    lift: <BsBuildingsFill color="#2F747F" />,
    carParking: <FaCar color="#2F747F" />,
    pinCode: <TbMapPinCode color="#2F747F" />,
    locationCoordinates: <TbWorldLongitude color="#2F747F" />,
  };

  const fieldLabels = {
    propertyMode: "Property Mode",
    propertyType: "Property Type",
    price: "Price",
    propertyAge: "Property Age",
    bankLoan: "Bank Loan",
    negotiation: "Negotiation",
    length: "Length",
    breadth: "Breadth",
    totalArea: "Total Area",
    ownership: "Ownership",
    bedrooms: "Bedrooms",
    kitchen: "Kitchen",
    // kitchenType: "Kitchen Type",
    balconies: "Balconies",
    floorNo: "Floor No.",
    areaUnit: "Area Unit",
    propertyApproved: "Property Approved",
    postedBy: "Posted By",
    facing: "Facing",
    salesMode: "Sales Mode",
    salesType: "Sales Type",
    description: "Description",
    furnished: "Furnished",
    lift: "Lift",
    attachedBathrooms: "Attached Bathrooms",
    western: "Western Toilet",
    numberOfFloors: "Number of Floors",
    carParking: "Car Parking",
    // rentalPropertyAddress: "Property Address",
    country: "Country",
    state: "State",
    city: "City",
    district: "District",
    area: "Area",
    streetName: "Street Name",
    doorNumber: "Door Number",
    nagar: "Nagar",
    ownerName: "Owner Name",
    email: "Email",
    phoneNumber: "Phone Number",
    phoneNumberCountryCode: "Phone Country Code",
    alternatePhone: "Alternate Phone",
    alternatePhoneCountryCode: "Alternate Phone Country Code",
    bestTimeToCall: "Best Time to Call",
  };

  const renderDropdown = (field) => {
    const options = dataList[field] || [];
    const filteredOptions = options.filter((option) =>
      option.toLowerCase().includes(dropdownState.filterText.toLowerCase()),
    );

    return (
      <div data-field={field}>
        {dropdownState.activeDropdown === field && (
          <div
            className="popup-overlay"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              zIndex: 1509,
              animation: "fadeIn 0.3s ease-in-out",
            }}
          >
            <div
              className="dropdown-popup"
              style={{
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                backgroundColor: "white",
                width: "100%",
                maxWidth: "300px",
                padding: "10px",
                zIndex: 10,
                boxShadow: "0 4px 8px rgba(0, 123, 255, 0.3)",
                borderRadius: "18px",
                animation: "popupOpen 0.3s ease-in-out",
              }}
            >
              <div
                className="p-1"
                style={{
                  fontWeight: 500,
                  fontSize: "15px",
                  marginBottom: "10px",
                  textAlign: "start",
                  color: "grey",
                }}
              >
                Select or Search{" "}
                <span style={{ color: "#0B57CF", fontWeight: 500 }}>
                  {fieldLabels[field] || "Property Field"}
                </span>
              </div>
              <div
                className="mb-1"
                style={{
                  position: "relative",
                  width: "100%",
                  background: "#EEF4FA",
                  borderRadius: "25px",
                }}
              >
                <FcSearch
                  size={16}
                  style={{
                    position: "absolute",
                    left: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                    color: "black",
                  }}
                />
                <input
                  className="m-0 rounded-0 ms-1"
                  type="text"
                  placeholder="Filter options..."
                  value={dropdownState.filterText}
                  onChange={handleFilterChange}
                  style={{
                    width: "100%",
                    padding: "5px 5px 5px 30px", // left padding for the icon
                    background: "transparent",
                    border: "none",
                    outline: "none",
                  }}
                />
              </div>

              <ul
                style={{
                  listStyleType: "none",
                  padding: 0,
                  margin: 0,
                  overflowY: "auto",
                  maxHeight: "350px",
                }}
              >
                {filteredOptions.map((option, index) => (
                  <li
                    key={index}
                    onClick={() => {
                      setFormData((prevState) => ({
                        ...prevState,
                        [field]: option,
                      }));

                      toggleDropdown(field); // Close current dropdown

                      const currentIndex =
                        filteredDropdownFieldOrder.indexOf(field);
                      if (
                        currentIndex !== -1 &&
                        currentIndex < filteredDropdownFieldOrder.length - 1
                      ) {
                        const nextField =
                          filteredDropdownFieldOrder[currentIndex + 1];

                        if (nonDropdownFields.includes(nextField)) {
                          // Focus input field
                          setTimeout(() => {
                            const nextInput = document.querySelector(
                              `[name="${nextField}"]`,
                            );
                            if (nextInput) {
                              nextInput.focus();
                              nextInput.scrollIntoView({
                                behavior: "smooth",
                                block: "center",
                              });
                            }
                          }, 150);
                        } else {
                          // Open next dropdown
                          setTimeout(() => {
                            toggleDropdown(nextField);
                            setTimeout(() => {
                              const el = document.querySelector(
                                `[data-field="${nextField}"]`,
                              );
                              if (el)
                                el.scrollIntoView({
                                  behavior: "smooth",
                                  block: "center",
                                });
                            }, 100);
                          }, 0);
                        }
                      }
                    }}
                    style={{
                      fontWeight: 300,
                      padding: "5px",
                      cursor: "pointer",
                      color: "grey",
                      marginBottom: "5px",
                      borderBottom: "1px solid #D0D7DE",
                    }}
                  >
                    {option}
                  </li>
                ))}
              </ul>

              <div className="d-flex justify-content-end">
                <button
                  className="me-1"
                  type="button"
                  onClick={() => {
                    toggleDropdown(field); // Close current dropdown

                    const currentIndex =
                      filteredDropdownFieldOrder.indexOf(field);
                    if (currentIndex > 0) {
                      const prevField =
                        filteredDropdownFieldOrder[currentIndex - 1];

                      if (nonDropdownFields.includes(prevField)) {
                        setTimeout(() => {
                          const prevInput = document.querySelector(
                            `[name="${prevField}"]`,
                          );
                          if (prevInput) {
                            prevInput.focus();
                            prevInput.scrollIntoView({
                              behavior: "smooth",
                              block: "center",
                            });
                          }
                        }, 100);
                      } else {
                        setTimeout(() => {
                          toggleDropdown(prevField);
                          setTimeout(() => {
                            const el = document.querySelector(
                              `[data-field="${prevField}"]`,
                            );
                            if (el)
                              el.scrollIntoView({
                                behavior: "smooth",
                                block: "center",
                              });
                          }, 100);
                        }, 0);
                      }
                    }
                  }}
                  style={{
                    background: "#EAEAF6",
                    cursor: "pointer",
                    border: "none",
                    color: "#0B57CF",
                    borderRadius: "10px",
                    padding: "5px 10px",
                    fontWeight: 500,
                  }}
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => {
                    toggleDropdown(field); // Close current dropdown

                    const currentIndex =
                      filteredDropdownFieldOrder.indexOf(field);

                    if (
                      currentIndex !== -1 &&
                      currentIndex < filteredDropdownFieldOrder.length - 1
                    ) {
                      const nextField =
                        filteredDropdownFieldOrder[currentIndex + 1];

                      if (nonDropdownFields.includes(nextField)) {
                        setTimeout(() => {
                          const nextInput = document.querySelector(
                            `[name="${nextField}"]`,
                          );
                          if (nextInput) {
                            nextInput.focus();
                            nextInput.scrollIntoView({
                              behavior: "smooth",
                              block: "center",
                            });
                          }
                        }, 100);
                      } else {
                        setTimeout(() => {
                          toggleDropdown(nextField); // Open next dropdown
                          setTimeout(() => {
                            const el = document.querySelector(
                              `[data-field="${nextField}"]`,
                            );
                            if (el)
                              el.scrollIntoView({
                                behavior: "smooth",
                                block: "center",
                              });
                          }, 100);
                        }, 0);
                      }
                    }
                  }}
                  style={{
                    background: "#EAEAF6",
                    cursor: "pointer",
                    border: "none",
                    color: "#0B57CF",
                    borderRadius: "10px",
                    padding: "5px 10px",
                    fontWeight: 500,
                    marginRight: "5px",
                  }}
                >
                  skip
                </button>

                <button
                  type="button"
                  onClick={() => toggleDropdown(field)}
                  style={{
                    background: "#0B57CF",
                    cursor: "pointer",
                    border: "none",
                    color: "#fff",
                    borderRadius: "10px",
                  }}
                >
                  Close
                </button>
              </div>

              {[
                "negotiation",
                "ownership",
                "floorNo",
                "postedBy",
                "carParking",
                "bestTimeToCall",
              ].includes(field) && (
                <div
                  style={{
                    marginTop: "10px",
                    paddingTop: "10px",
                    borderTop: "1px solid #ccc",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 400,
                      color: "#555",
                      marginBottom: "8px",
                    }}
                  >
                    Swipe through options to continue
                  </div>
                  {/* Optional Continue Button can go here */}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const requiredFields = [
    "propertyMode",
    "propertyType",
    "price",
    "totalArea",
    "areaUnit",
    "salesType",
    "postedBy",
    "phoneNumber",
    "area",
    "pinCode",
  ];

  const nonDropdownFields = [
    "price",
    "length",
    "totalArea",
    "description",
    "city",
    "area",
    "alternatePhone",
  ];

  const dropdownFieldOrder = [
    "propertyMode",
    "propertyType",
    "price",
    "negotiation",
    "length",
    "breadth",
    "totalArea",
    "areaUnit",
    "ownership",
    "bedrooms",
    "kitchen",
    "balconies",
    "floorNo",
    "propertyApproved",
    "propertyAge",
    "bankLoan",
    "facing",
    "salesMode",
    "salesType",
    "postedBy",
    "description",
    "furnished",
    "lift",
    "attachedBathrooms",
    "western",
    // "numberOfFloors",
    "carParking",
    "YourProperty",
    "city",
    "district",
    "area",
    "alternatePhone",

    "bestTimeToCall",
  ];
  const hiddenPropertyTypes = ["Plot", "Land", "Agricultural Land"];

  const fieldsToHideForPlot = [
    "furnished",
    "lift",
    "attachedBathrooms",
    "western",
    // 'numberOfFloors',
    "carParking",
    "bedrooms",
    "kitchen",
    "kitchenType",
    "balconies",
    "floorNo",
  ];
  const shouldHideField = (fieldName) =>
    hiddenPropertyTypes.includes(formData.propertyType) &&
    fieldsToHideForPlot.includes(fieldName);

  const filteredDropdownFieldOrder = dropdownFieldOrder.filter(
    (field) => !shouldHideField(field),
  );
  const selectFields = [
    "propertyMode",
    "propertyType",
    "bankLoan",
    "negotiation",
    "ownership",
    "bedrooms",
    "kitchen",
    "balconies",
    "floorNo",
    "areaUnit",
    "propertyApproved",
    "propertyAge",
    "postedBy",
    "facing",
    "salesMode",
    "salesType",
    "furnished",
    "lift",
    "attachedBathrooms",
    "western",
    "numberOfFloors",
    "carParking",
    "bestTimeToCall",
  ];

  const inputFields = [
    "state",
    "city",
    "district",
    "area",
    "streetName",
    "doorNumber",
    "nagar",
    "ownerName",
    "email",
    "phoneNumber",
    "alternatePhone",
    "price",
  ];

  const fields = [
    { name: "propertyMode", type: "select" },
    { name: "propertyType", type: "select" },
    { name: "price", type: "input" },
    { name: "negotiation", type: "select" },
    { name: "length", type: "input" },
    { name: "breadth", type: "input" },
    { name: "totalArea", type: "input" },
    { name: "areaUnit", type: "select" },
    { name: "ownership", type: "select" },
    { name: "bedrooms", type: "select" },
    { name: "kitchen", type: "select" },
    { name: "balconies", type: "select" },
    { name: "floorNo", type: "select" },
    { name: "propertyApproved", type: "select" },
    { name: "propertyAge", type: "select" },
    { name: "bankLoan", type: "select" },
    { name: "facing", type: "select" },
    { name: "salesMode", type: "select" },
    { name: "salesType", type: "select" },
    { name: "postedBy", type: "select" },
    { name: "description", type: "input" },
    { name: "furnished", type: "select" },
    { name: "lift", type: "select" },
    { name: "attachedBathrooms", type: "select" },
    { name: "western", type: "select" },
    { name: "numberOfFloors", type: "select" },
    { name: "carParking", type: "select" },
    { name: "rentalPropertyAddress", type: "input" },
    { name: "country", type: "input" },
    { name: "state", type: "input" },
    { name: "city", type: "input" },
    { name: "district", type: "select" },
    { name: "area", type: "input" },
    { name: "nagar", type: "input" },
    { name: "streetName", type: "input" },
    { name: "doorNumber", type: "input" },
    { name: "pinCode", type: "input" },
    { name: "locationCoordinates", type: "input" },

    { name: "ownerName", type: "input" },
    { name: "email", type: "input" },
    { name: "phoneNumber", type: "input" },
    { name: "alternatePhone", type: "input" },
    { name: "bestTimeToCall", type: "select" },
  ];

  if (loading) return <p>Loading...</p>;

  if (!allowedRoles.includes(fileName)) {
    return (
      <div className="text-center text-red-500 font-semibold text-lg mt-10">
        Only admin is allowed to view this file.
      </div>
    );
  }

  return (
    <div className="d-flex align-items-center justify-content-center">
      {/* Draft restore prompt — shown once on mount if a previous session
          left a non-empty draft in IndexedDB. User must choose before the
          form auto-saves anything new. */}
      {pendingDraft && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1050,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "10px",
              padding: "24px",
              width: "min(420px, 92vw)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
            }}
          >
            <h5 className="fw-bold mb-2">Unsaved draft found</h5>
            <p className="text-muted mb-3" style={{ fontSize: "14px" }}>
              You started filling this form earlier and didn't submit it.
              {pendingDraft.savedAt && (
                <>
                  {" "}
                  Last saved{" "}
                  <strong>
                    {new Date(pendingDraft.savedAt).toLocaleString()}
                  </strong>
                  .
                </>
              )}{" "}
              Restore it, or discard and start fresh?
            </p>
            <ul
              className="text-muted mb-3"
              style={{ fontSize: "13px", paddingLeft: "18px" }}
            >
              <li>
                Photos:{" "}
                {Array.isArray(pendingDraft.photos)
                  ? pendingDraft.photos.length
                  : 0}
              </li>
              <li>
                Videos:{" "}
                {Array.isArray(pendingDraft.videos)
                  ? pendingDraft.videos.length
                  : 0}
              </li>
              <li>
                Filled fields:{" "}
                {pendingDraft.formData
                  ? Object.values(pendingDraft.formData).filter(
                      (v) => v !== "" && v !== null && v !== undefined
                    ).length
                  : 0}
              </li>
            </ul>
            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={handleDiscardDraft}
              >
                Discard
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleRestoreDraft}
              >
                Restore Draft
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          width: "100%",
          maxWidth: "450px",
          minWidth: "300px",
          padding: "5px",
          borderRadius: "8px",
          margin: "0 5px",
        }}
      >
        <h1>Property Management</h1>
        {draftStatus && (
          <p
            className="text-muted mb-2"
            style={{ fontSize: "12px", fontStyle: "italic" }}
          >
            {draftStatus}
          </p>
        )}
        <form className="addForm" onSubmit={handleSubmit}>
          <p
            className="p-3"
            style={{ color: "white", backgroundColor: "rgb(47,116,127)" }}
          >
            PPC-ID: {ppcId}
          </p>

          <h4
            style={{
              color: "rgb(47,116,127)",
              fontWeight: "bold",
              marginBottom: "10px",
            }}
          >
            {" "}
            Property Images{" "}
          </h4>

          <div className="form-group photo-upload-container mt-2">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handlePhotoUpload}
              name="photos"
              id="photo-upload"
              className="photo-upload-input"
              style={{ display: "none" }} // Hide the input field
            />
            <label
              htmlFor="photo-upload"
              className="photo-upload-label fw-normal m-0"
            >
              <MdAddPhotoAlternate
                style={{
                  color: "white",
                  backgroundColor: "#2e86e4",
                  padding: "5px",
                  fontSize: "30px",
                  borderRadius: "50%",
                  marginRight: "5px",
                }}
              />
              Upload Your Property Images
            </label>
          </div>

          {uploadingPhotos ? (
            <p>Compressing...</p>
          ) : (
            photos.length > 0 && (
              <div className="uploaded-photos">
                <h4>Uploaded Photos</h4>
                <div className="uploaded-photos-grid">
                  {photos.map((photo, index) => {
                    const isDefault = selectedPhotoIndex === index;
                    const ACCENT = "#4FC04F"; // bright green for ring + badges
                    return (
                      <div
                        key={index}
                        className="uploaded-photo-item"
                        role="button"
                        tabIndex={0}
                        onClick={() => handlePhotoSelect(index)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handlePhotoSelect(index);
                          }
                        }}
                        title={
                          isDefault
                            ? "Default photo"
                            : "Click to set as default"
                        }
                        style={{
                          cursor: "pointer",
                          padding: "14px",
                          borderRadius: "14px",
                          border: isDefault
                            ? `3px solid ${ACCENT}`
                            : "3px solid transparent",
                          background: isDefault ? "#E9FBE9" : "transparent",
                          transition:
                            "border-color 0.2s ease, background 0.2s ease",
                        }}
                      >
                        {/* Hidden radio retained for form semantics */}
                        <input
                          type="radio"
                          name="selectedPhoto"
                          checked={isDefault}
                          onChange={() => handlePhotoSelect(index)}
                          style={{
                            position: "absolute",
                            opacity: 0,
                            pointerEvents: "none",
                          }}
                        />

                        <img
                          src={URL.createObjectURL(photo)}
                          alt="Uploaded"
                          className="uploaded-photo mb-0"
                        />

                        {/* Top-left green check badge — only on the default photo */}
                        {isDefault && (
                          <span
                            style={{
                              position: "absolute",
                              top: "2px",
                              left: "2px",
                              width: "26px",
                              height: "26px",
                              borderRadius: "50%",
                              background: ACCENT,
                              color: "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                              pointerEvents: "none",
                            }}
                          >
                            <FaCheck size={12} />
                          </span>
                        )}

                        {/* Bottom-center "DEFAULT" pill */}
                        {isDefault && (
                          <span
                            style={{
                              position: "absolute",
                              bottom: "18px",
                              left: "50%",
                              transform: "translateX(-50%)",
                              background: ACCENT,
                              color: "#fff",
                              fontSize: "11px",
                              fontWeight: 700,
                              padding: "3px 12px",
                              borderRadius: "12px",
                              letterSpacing: "0.5px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                              pointerEvents: "none",
                            }}
                          >
                            <FaCheck size={10} /> DEFAULT
                          </span>
                        )}

                        <button
                          type="button"
                          style={{
                            border: "none",
                            background: "#fff",
                            borderRadius: "50%",
                            lineHeight: 0,
                          }}
                          className="position-absolute top-0 end-0 m-0 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            removePhoto(index);
                          }}
                        >
                          <IoCloseCircle size={24} color="#F22952" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          )}

          {/* Video Upload Section */}
          <h4
            style={{
              color: "rgb(47,116,127)",
              fontWeight: "bold",
              marginBottom: "10px",
            }}
          >
            Property Video
          </h4>
          <div className="form-group">
            <input
              type="file"
              name="video"
              accept="video/*"
              id="videoUpload"
              onChange={handleVideoChange}
              className="d-none"
            />
            <label
              htmlFor="videoUpload"
              className="file-upload-label fw-normal"
            >
              <span className="pt-5">
                <FaFileVideo
                  style={{
                    color: "white",
                    backgroundColor: "#2e86e4",
                    padding: "5px",
                    fontSize: "30px",
                    marginRight: "5px",
                  }}
                />
                Upload Property Video
              </span>
            </label>

            {/* Display the selected video */}
            {uploadingVideos ? (
              <p>Uploading...</p>
            ) : (
              videos.length > 0 && (
                <div className="selected-video-container mt-3">
                  <h5 className="text-start">Selected Videos:</h5>
                  <div
                    style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}
                  >
                    {videos.map((video, index) => (
                      <div
                        key={index}
                        style={{
                          position: "relative",
                          display: "inline-block",
                        }}
                      >
                        <video width="200" height="200" controls>
                          <source
                            src={URL.createObjectURL(video)}
                            type="video/mp4"
                          />
                          Your browser does not support the video tag.
                        </video>
                        <Button
                          variant="danger"
                          onClick={() => removeVideo(index)}
                          style={{ border: "none", background: "transparent" }}
                          className="position-absolute top-0 end-0 m-1 p-1"
                        >
                          <IoCloseCircle size={20} color="#F22952" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>

          {fields.map(({ name, type }) => {
            if (shouldHideField(name)) return null;

            if (name === "rentalPropertyAddress") {
              return (
                <div key={name} className="form-group">
                  <div className="form-group">
                    <div
                      className="input-card p-0 rounded-1"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "100%",
                        border: "1px solid #2F747F",
                        background: "#fff",
                      }}
                    >
                      <FcSearch
                        className="input-icon"
                        style={{ color: "#2F747F", marginLeft: "10px" }}
                      />
                      <input
                        ref={inputRef}
                        id="pac-input"
                        className="form-input m-0"
                        placeholder="Search location"
                        style={{
                          flex: "1 0 80%",
                          padding: "8px",
                          fontSize: "14px",
                          border: "none",
                          outline: "none",
                        }}
                      />
                    </div>
                  </div>
                  <div
                    ref={mapRef}
                    id="map"
                    style={{ height: "200px", width: "100%" }}
                  ></div>

                  <div className="mt-3 w-100 d-flex gap-2 mb-2">
                    <input
                      ref={coordRef}
                      placeholder="Enter Your Property Coordinates"
                      className="form-control m-0"
                      onChange={(e) => setCoordinateInput(e.target.value)}
                    />
                    <button
                      className="btn btn-primary m-0 border-0"
                      type="button"
                      style={{ whiteSpace: "nowrap", background: "#6CBAAF" }}
                      onClick={() => handleLatLngAuto(coordinateInput)}
                    >
                      Go
                    </button>

                    <button
                      onClick={handleClear}
                      type="button"
                      className="btn btn-primary m-0 border-0"
                      style={{ whiteSpace: "nowrap", background: "#B1D3C0" }}
                    >
                      <MdOutlineClose color="white" />
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div key={name} className="form-group">
                <label
                  style={{
                    color: "#2F747F",
                    fontWeight: "bold",
                    display: "block",
                    marginBottom: "5px",
                  }}
                >
                  {name.replace(/([A-Z])/g, " $1").trim()}
                  {requiredFields.includes(name) && (
                    <span style={{ color: "red" }}> * </span>
                  )}
                </label>

                {type === "select" ? (
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <div style={{ flex: "1" }}>
                      <label>
                        <select
                          name={name}
                          value={formData[name] || ""}
                          onChange={handleFieldChange}
                          className="form-control"
                          required={requiredFields.includes(name)}
                          style={{ display: "none" }}
                        >
                          <option value="">
                            Select {name.replace(/([A-Z])/g, " $1")}
                          </option>
                          {dataList[name]?.map((option, index) => (
                            <option key={index} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => toggleDropdown(name)}
                          style={{
                            cursor: "pointer",
                            border: "1px solid #2F747F",
                            padding: "10px",
                            background: "#fff",
                            borderRadius: "5px",
                            width: "100%",
                            textAlign: "left",
                            color: "#2F747F",
                          }}
                        >
                          <span style={{ marginRight: "10px" }}>
                            {fieldIcons[name] || <FaHome />}
                          </span>
                          {formData[name] ||
                            `Select ${name.replace(/([A-Z])/g, " $1")}`}
                        </button>

                        {renderDropdown(name)}
                      </label>
                    </div>
                  </div>
                ) : name === "description" ? (
                  <div
                    className="input-card p-0 rounded-1"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "100%",
                      border: "1px solid #2F747F",
                      background: "#fff",
                    }}
                  >
                    <span
                      className="input-icon"
                      style={{ color: "#2F747F", marginLeft: "10px" }}
                    >
                      {fieldIcons[name] || <FaEdit />}
                    </span>
                    <textarea
                      name={name}
                      value={formData[name] || ""}
                      onChange={handleFieldChange}
                      required={requiredFields.includes(name)}
                      className="form-input m-0"
                      placeholder={`Enter ${name.replace(/([A-Z])/g, " $1")}`}
                      style={{
                        flex: "1 0 70%",
                        padding: "8px",
                        fontSize: "14px",
                        border: "none",
                        outline: "none",
                        minHeight: "100px",
                        resize: "vertical",
                        color: "#2F747F",
                      }}
                    />
                  </div>
                ) : (
                  <>
                    <div
                      className="input-card p-0 rounded-1"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "100%",
                        border: "1px solid #2F747F",
                        background: "#fff",
                      }}
                    >
                      <span
                        className="input-icon"
                        style={{ color: "#2F747F", marginLeft: "10px" }}
                      >
                        {fieldIcons[name] || <FaEdit />}
                      </span>

                      {name === "phoneNumber" && (
                        <select
                          name="phoneNumberCountryCode"
                          value={formData.phoneNumberCountryCode || ""}
                          onChange={handleFieldChange}
                          className="form-control m-0"
                          style={{
                            width: "30%",
                            padding: "8px",
                            fontSize: "14px",
                            border: "none",
                            outline: "none",
                          }}
                        >
                          <option value="">Select Country Code</option>
                          {countryCodes.map((item, index) => (
                            <option key={index} value={item.code}>
                              {item.code} - {item.country}
                            </option>
                          ))}
                        </select>
                      )}

                      {name === "alternatePhone" && (
                        <select
                          name="alternatePhoneCountryCode"
                          value={formData.alternatePhoneCountryCode || ""}
                          onChange={handleFieldChange}
                          className="form-control m-0"
                          style={{
                            width: "30%",
                            padding: "8px",
                            fontSize: "14px",
                            border: "none",
                            outline: "none",
                          }}
                        >
                          <option value="">Select Country Code</option>
                          {alternateCountryCodes.map((item, index) => (
                            <option key={index} value={item.code}>
                              {item.code} - {item.country}
                            </option>
                          ))}
                        </select>
                      )}

                      <input
                        type={name === "email" ? "email" : "text"}
                        name={name}
                        value={formData[name] || ""}
                        onChange={handleFieldChange}
                        required={requiredFields.includes(name)}
                        className="form-input m-0"
                        placeholder={`Enter ${name.replace(/([A-Z])/g, " $1")}`}
                        style={{
                          flex: "1 0 70%",
                          padding: "8px",
                          fontSize: "14px",
                          border: "none",
                          outline: "none",
                          color: "#2F747F",
                        }}
                      />
                    </div>

                    {name === "price" && priceInWords && (
                      <p
                        style={{
                          fontSize: "14px",
                          color: "#2F747F",
                          marginTop: "5px",
                        }}
                      >
                        {priceInWords}
                      </p>
                    )}
                  </>
                )}
              </div>
            );
          })}

          <button
            type="submit"
            style={{ background: "#2F747F", color: "#fff" }}
          >
            Save Property
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddProperty;