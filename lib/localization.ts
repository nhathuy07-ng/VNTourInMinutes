export type Language = "en" | "vi";

export interface LocalizationEntry {
  en: string;
  vi: string;
}

export const localization: Record<string, LocalizationEntry> = {
  // Common / General
  "app_name": {
    en: "VNTourInMinutes",
    vi: "VNTourInMinutes"
  },
  "loading": {
    en: "Loading...",
    vi: "Đang tải..."
  },
  "cancel": {
    en: "Cancel",
    vi: "Hủy"
  },
  "save": {
    en: "Save",
    vi: "Lưu"
  },
  "discard": {
    en: "Discard",
    vi: "Hủy bỏ"
  },
  "retry": {
    en: "Retry",
    vi: "Thử lại"
  },
  "continue": {
    en: "Continue",
    vi: "Tiếp tục"
  },
  "proceed": {
    en: "Proceed",
    vi: "Tiếp tục"
  },
  "next_step": {
    en: "Next Step",
    vi: "Tiếp tục"
  },
  "skip": {
    en: "Skip",
    vi: "Bỏ qua"
  },
  "yes": {
    en: "Yes",
    vi: "Có"
  },
  "no": {
    en: "No",
    vi: "Không"
  },
  "search": {
    en: "Search",
    vi: "Tìm kiếm"
  },
  "mins": {
    en: "mins",
    vi: "phút"
  },
  "outdoor": {
    en: "Outdoor",
    vi: "Ngoài trời"
  },
  "indoor": {
    en: "Indoor",
    vi: "Trong nhà"
  },
  "event": {
    en: "Event",
    vi: "Sự kiện"
  },
  "car": {
    en: "CAR",
    vi: "Ô TÔ"
  },
  "bus": {
    en: "BUS",
    vi: "XE BUÝT"
  },
  "bike": {
    en: "BIKE",
    vi: "XE MÁY"
  },
  "info": {
    en: "INFO",
    vi: "INFO"
  },
  "info_btn": {
    en: "INFO",
    vi: "INFO"
  },
  "unavailable": {
    en: "Unavailable",
    vi: "Không khả dụng"
  },

  // Sign In View
  "sign_in_tagline": {
    en: "Plan your own tour in minutes.",
    vi: "Lên kế hoạch chuyến đi của bạn chỉ trong vài phút."
  },
  "sign_in_with_google": {
    en: "Sign in with Google",
    vi: "Đăng nhập bằng Google"
  },
  "continue_as_guest": {
    en: "Continue as Guest",
    vi: "Tiếp tục với tư cách Khách"
  },

  // Main View
  "your_tours": {
    en: "Your Tours",
    vi: "Chuyến đi của bạn"
  },
  "signed_in_as": {
    en: "Signed in as",
    vi: "Đã đăng nhập:"
  },
  "menu": {
    en: "Menu",
    vi: "Menu"
  },
  "refresh": {
    en: "Refresh",
    vi: "Làm mới"
  },
  "language": {
    en: "Language",
    vi: "Ngôn ngữ"
  },
  "english": {
    en: "English",
    vi: "English"
  },
  "vietnamese": {
    en: "Tiếng Việt",
    vi: "Tiếng Việt"
  },
  "feedback": {
    en: "Feedback",
    vi: "Góp ý"
  },
  "sign_out": {
    en: "Logout",
    vi: "Đăng xuất"
  },
  "sign_in_btn": {
    en: "Sign In",
    vi: "Đăng nhập"
  },
  "no_upcoming_tours": {
    en: "No upcoming tours.",
    vi: "Không có chuyến đi sắp tới nào."
  },
  "plan_your_tour": {
    en: "Plan your tour!",
    vi: "Lên kế hoạch chuyến đi!"
  },
  "view_past_tours": {
    en: "View past tours",
    vi: "Xem các chuyến đi đã qua"
  },
  "todays_tour": {
    en: "Today's tour",
    vi: "Chuyến đi hôm nay"
  },
  "your_upcoming_tour": {
    en: "Your upcoming tour",
    vi: "Chuyến đi sắp tới của bạn"
  },
  "all_tours": {
    en: "All tours",
    vi: "Tất cả chuyến đi"
  },
  "choose_planning_mode": {
    en: "Choose Planning Mode",
    vi: "Chọn chế độ lên kế hoạch"
  },
  "mode_events_title": {
    en: "Events + Side attractions",
    vi: "Sự kiện + Địa điểm phụ"
  },
  "mode_events_desc": {
    en: "Find events happening in this city and build a trip around them.",
    vi: "Tìm các sự kiện đang diễn ra tại thành phố này và lên lịch trình xoay quanh chúng."
  },
  "mode_attractions_title": {
    en: "Attractions only",
    vi: "Chỉ địa điểm tham quan"
  },
  "mode_attractions_desc": {
    en: "Plan a classic itinerary with places to visit.",
    vi: "Lên lịch trình truyền thống với các điểm đến tham quan."
  },
  "past_tours": {
    en: "Past Tours",
    vi: "Chuyến đi đã qua"
  },

  // Itinerary Detail View
  "tour_details": {
    en: "Tour Details",
    vi: "Chi tiết chuyến đi"
  },
  "get_directions_first_attraction": {
    en: "Get direction to your first attraction",
    vi: "Chỉ đường đến điểm tham quan đầu tiên"
  },
  "get_directions": {
    en: "Get directions",
    vi: "Chỉ đường"
  },
  "take_line": {
    en: "Take",
    vi: "Bắt tuyến"
  },
  "towards": {
    en: "towards",
    vi: "hướng"
  },
  "station": {
    en: "station",
    vi: "trạm"
  },
  "stops": {
    en: "stops",
    vi: "trạm"
  },
  "stop": {
    en: "stop",
    vi: "trạm"
  },
  "transit": {
    en: "Transit",
    vi: "Phương tiện công cộng"
  },
  "walk_to_destination": {
    en: "Walk to destination",
    vi: "Đi bộ đến điểm đến"
  },
  "loading_itinerary_details": {
    en: "Loading itinerary details...",
    vi: "Đang tải chi tiết lịch trình..."
  },
  "tour_ai_footnote": {
    en: "Tour descriptions are synthesized by AI and mistakes may occur.",
    vi: "Mô tả chuyến đi được tổng hợp bởi AI và có thể có sai sót."
  },

  // New Itinerary View - Step 1
  "new_tour": {
    en: "New Tour",
    vi: "Chuyến đi mới"
  },
  "destination": {
    en: "Destination",
    vi: "Điểm đến"
  },
  "about_cities": {
    en: "ABOUT CITIES",
    vi: "THÔNG TIN THÀNH PHỐ"
  },
  "about_cities_title": {
    en: "About Cities",
    vi: "Thông tin các thành phố"
  },
  "select_a_city": {
    en: "Select a city",
    vi: "Chọn một thành phố"
  },
  "search_city_placeholder": {
    en: "Search city...",
    vi: "Tìm kiếm thành phố..."
  },
  "search_city_info_placeholder": {
    en: "Search by city name or information...",
    vi: "Tìm theo tên thành phố hoặc thông tin..."
  },
  "no_city_found": {
    en: "No city found",
    vi: "Không tìm thấy thành phố"
  },
  "no_matches_found": {
    en: "No matches found.",
    vi: "Không tìm thấy kết quả phù hợp."
  },
  "date": {
    en: "Date",
    vi: "Ngày"
  },
  "interests_and_details": {
    en: "Interests & Details",
    vi: "Sở thích & Chi tiết"
  },
  "places": {
    en: "Places",
    vi: "Địa điểm"
  },
  "show_less": {
    en: "Show less",
    vi: "Thu gọn"
  },
  "more_places": {
    en: "More places...",
    vi: "Thêm địa điểm..."
  },
  "select_city_first_places": {
    en: "Please select a city first to view available places.",
    vi: "Vui lòng chọn thành phố trước để xem các địa điểm khả dụng."
  },
  "preferences": {
    en: "Preferences",
    vi: "Tùy chọn"
  },
  "child_friendly": {
    en: "Child-friendly",
    vi: "Thân thiện với trẻ em"
  },
  "accessible": {
    en: "Accessible",
    vi: "Tiếp cận cho người khuyết tật"
  },
  "lesser_known_places": {
    en: "Lesser known places",
    vi: "Địa điểm ít người biết"
  },
  "finding_places": {
    en: "Finding Places...",
    vi: "Đang tìm địa điểm..."
  },
  "failed_generate_tour": {
    en: "Failed to generate tour.",
    vi: "Không thể tạo chuyến đi."
  },

  // Discard Dialog
  "discard_itinerary_title": {
    en: "Discard itinerary?",
    vi: "Hủy lịch trình?"
  },
  "discard_itinerary_desc": {
    en: "Are you sure you want to go back? Your current itinerary and generated suggestions will be lost.",
    vi: "Bạn có chắc muốn quay lại? Lịch trình hiện tại và các gợi ý đã tạo sẽ bị mất."
  },

  // Plan Itinerary View - Step 2 & 5
  "plan_itinerary": {
    en: "Plan Itinerary",
    vi: "Lên lịch trình"
  },
  "tour_start_time": {
    en: "Tour Start Time",
    vi: "Giờ bắt đầu chuyến đi"
  },
  "adjust_day_begins": {
    en: "Adjust when your day begins",
    vi: "Điều chỉnh thời gian bắt đầu ngày mới của bạn"
  },
  "your_itinerary": {
    en: "Your Itinerary",
    vi: "Lịch trình của bạn"
  },
  "select_places_below": {
    en: "Select places from below to add to your tour.",
    vi: "Chọn các địa điểm bên dưới để thêm vào chuyến đi của bạn."
  },
  "warning_outside_opening_hours": {
    en: "Warning: Outside opening hours",
    vi: "Cảnh báo: Ngoài giờ mở cửa"
  },
  "suggestions": {
    en: "Suggestions",
    vi: "Gợi ý"
  },
  "calculating": {
    en: "Calculating...",
    vi: "Đang tính toán..."
  },
  "recalculate_itinerary": {
    en: "Calculate Itinerary",
    vi: "Tính toán lịch trình"
  },
  "save_tour": {
    en: "Save Tour",
    vi: "Lưu chuyến đi"
  },
  "edit_stay_time": {
    en: "Edit Stay Time",
    vi: "Chỉnh sửa thời gian lưu lại"
  },
  "edit_stay_time_title": {
    en: "Edit Stay Time",
    vi: "Chỉnh sửa thời gian lưu lại"
  },

  // Time Warning Popup
  "time_warning_title": {
    en: "Time Warning",
    vi: "Cảnh báo thời gian"
  },
  "time_warning_desc": {
    en: "Some events in your itinerary have timing conflicts or late arrival warnings. Do you want to proceed anyway?",
    vi: "Một số sự kiện trong lịch trình của bạn có xung đột thời gian hoặc cảnh báo đến muộn. Bạn có muốn tiếp tục không?"
  },
  "time_warning_desc_places": {
    en: "Some places in your itinerary are scheduled outside of their regular opening hours. Do you want to proceed anyway?",
    vi: "Một số địa điểm trong lịch trình của bạn được xếp ngoài giờ mở cửa thông thường. Bạn có muốn tiếp tục không?"
  },
  "time_warning_desc_events": {
    en: "Some events in your itinerary have timing conflicts or late arrival warnings. Do you want to proceed anyway?",
    vi: "Một số sự kiện trong lịch trình của bạn có xung đột thời gian hoặc cảnh báo đến muộn. Bạn có muốn tiếp tục không?"
  },

  // Places Info Popup
  "places_information": {
    en: "Places Information",
    vi: "Thông tin địa điểm"
  },
  "places_information_title": {
    en: "Places Information",
    vi: "Thông tin địa điểm"
  },
  "no_places_available": {
    en: "No places available.",
    vi: "Không có địa điểm khả dụng."
  },
  "no_description_available": {
    en: "No description available.",
    vi: "Không có mô tả."
  },

  // Final Step
  "tour_finalized_title": {
    en: "Tour Finalized!",
    vi: "Hoàn tất lịch trình!"
  },
  "tour_finalized_subtitle": {
    en: "Give your tour a name to save it.",
    vi: "Đặt tên cho chuyến đi để lưu lại."
  },
  "give_tour_name_desc": {
    en: "Give your tour a name to save it.",
    vi: "Đặt tên cho chuyến đi để lưu lại."
  },
  "save_and_finish": {
    en: "Save and Finish",
    vi: "Lưu và Hoàn tất"
  },
  "default_tour_name": {
    en: "{city} tour, {date}",
    vi: "Tour {city}, {date}"
  },
  "trip_suffix": {
    en: "trip",
    vi: "chuyến đi"
  },

  // New Event Itinerary View
  "find_events": {
    en: "Find Events",
    vi: "Tìm sự kiện"
  },
  "from_month_optional": {
    en: "From (Optional)",
    vi: "Từ tháng (Tùy chọn)"
  },
  "to_month_optional": {
    en: "To (Optional)",
    vi: "Đến tháng (Tùy chọn)"
  },
  "categories": {
    en: "Categories",
    vi: "Danh mục"
  },
  "searching_events": {
    en: "Searching events...",
    vi: "Đang tìm sự kiện..."
  },
  "select_events": {
    en: "Select Events",
    vi: "Chọn sự kiện"
  },
  "found_events_count": {
    en: "Found {count} event(s) matching your criteria.",
    vi: "Tìm thấy {count} sự kiện phù hợp với tiêu chí của bạn."
  },
  "no_events_found": {
    en: "No events found for this selection.",
    vi: "Không tìm thấy sự kiện nào cho lựa chọn này."
  },
  "participation_options": {
    en: "Participation Options",
    vi: "Các lựa chọn tham gia"
  },
  "information_sources": {
    en: "Information Sources",
    vi: "Nguồn thông tin"
  },
  "warning_overlapping_events": {
    en: "Warning: You have selected overlapping events. You might not be able to attend the event(s) in its full length and some events may have policies preventing late check-ins.",
    vi: "Cảnh báo: Bạn đã chọn các sự kiện bị trùng giờ. Bạn có thể không tham dự trọn vẹn sự kiện và một số sự kiện có thể có quy định không cho phép vào cửa muộn."
  },
  "options_selected_count": {
    en: "{count} option(s) selected",
    vi: "Đã chọn {count} lựa chọn"
  },
  "add_side_attractions_title": {
    en: "Add Side Attractions?",
    vi: "Thêm địa điểm phụ?"
  },
  "add_side_attractions_heading": {
    en: "Add side attractions?",
    vi: "Thêm địa điểm phụ?"
  },
  "explore_city_pace": {
    en: "Explore {city} at your own pace.",
    vi: "Khám phá {city} theo cách riêng của bạn."
  },
  "side_attractions": {
    en: "Side Attractions",
    vi: "Địa điểm phụ"
  },
  "finding": {
    en: "Finding...",
    vi: "Đang tìm..."
  },
  "warning_arrive_late": {
    en: "Warning: You arrive late. Please check the event's policy regarding late check-ins.",
    vi: "Cảnh báo: Bạn đến muộn. Vui lòng kiểm tra quy định của sự kiện về việc vào cửa muộn."
  },
  "nudge_arrive_early": {
    en: "You arrive early. Explore nearby spots before the main event begins!",
    vi: "Bạn đến sớm. Hãy khám phá các địa điểm lân cận trước khi sự kiện chính bắt đầu!"
  },
  "nudge_early_arrive": {
    en: "You arrive early. Explore nearby spots before the main event begins!",
    vi: "Bạn đến sớm. Hãy khám phá các địa điểm lân cận trước khi sự kiện chính bắt đầu!"
  },
  "nudge_leave_early": {
    en: "You leave before the event ends. You might not enjoy it in full.",
    vi: "Bạn rời đi trước khi sự kiện kết thúc. Bạn có thể không trải nghiệm trọn vẹn sự kiện."
  },
  "nudge_early_leave": {
    en: "You leave before the event ends. You might not enjoy it in full.",
    vi: "Bạn rời đi trước khi sự kiện kết thúc. Bạn có thể không trải nghiệm trọn vẹn sự kiện."
  },

  // Event Categories
  "category_sports_events_participate": {
    en: "Sports Events (Participate)",
    vi: "Sự kiện thể thao (Tham gia)"
  },
  "category_sports_matches_spectate": {
    en: "Sports Matches (Spectate)",
    vi: "Trận đấu thể thao (Xem / Cổ vũ)"
  },
  "category_sports_events": {
    en: "Sports Events",
    vi: "Sự kiện thể thao"
  },
  "category_traditional_folk_festivals": {
    en: "Traditional / Folk Festivals",
    vi: "Lễ hội truyền thống / Dân gian"
  },
  "category_culinary_fairs": {
    en: "Culinary Fairs",
    vi: "Hội chợ ẩm thực"
  },
  "category_live_cultural_nighttime_shows": {
    en: "Live Cultural / Nighttime Shows",
    vi: "Biểu diễn văn hóa / Show diễn đêm"
  },
  "category_craft_workshops": {
    en: "Craft Workshops",
    vi: "Xưởng thủ công"
  },
  "category_expos": {
    en: "Expos",
    vi: "Triển lãm"
  },
  "category_concerts": {
    en: "Concerts",
    vi: "Hòa nhạc"
  },
  "category_other": {
    en: "Other",
    vi: "Khác"
  },
  "failed_find_events": {
    en: "Failed to find events.",
    vi: "Không tìm thấy sự kiện."
  },
  "network_error": {
    en: "Network error. Please try again.",
    vi: "Lỗi kết nối. Vui lòng thử lại."
  },
  "failed_find_places": {
    en: "Failed to find places.",
    vi: "Không tìm thấy địa điểm."
  },
  "my_event_tour": {
    en: "My Event Tour",
    vi: "Chuyến đi sự kiện của tôi"
  }
};

/**
 * Dynamically gets the localized string for a given phrase_id and language.
 * Supports token substitution like {count}, {city}, etc.
 */
export function getLocalizedText(
  phraseId: string,
  lang: Language = "en",
  params?: Record<string, string | number>
): string {
  const entry = localization[phraseId];
  let text = entry ? (entry[lang] || entry["en"] || phraseId) : phraseId;
  
  if (params) {
    Object.entries(params).forEach(([key, val]) => {
      text = text.replaceAll(`{${key}}`, String(val));
    });
  }
  
  return text;
}

import { useStore } from "./store";

export function useTranslation() {
  const language = useStore((state) => state.language) || "en";
  const setLanguage = useStore((state) => state.setLanguage);

  const t = (phraseId: string, params?: Record<string, string | number>): string => {
    return getLocalizedText(phraseId, language, params);
  };

  return { t, language, setLanguage };
}

