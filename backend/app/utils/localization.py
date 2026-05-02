from typing import Any

def get_preferred_language(accept_language: str | None) -> str:
    """Determine preferred language from Accept-Language header."""
    if not accept_language:
        return "en"
    
    # Simple parser for Accept-Language header
    # e.g., "ar-SA,ar;q=0.9,en-US;q=0.8,en;q=0.7"
    try:
        languages = [lang.split(";")[0].split("-")[0].strip().lower() for lang in accept_language.split(",")]
        for lang in languages:
            if lang in ["ar", "en"]:
                return lang
    except Exception:
        pass
    
    return "en"

def localize_place_schema(place_read_obj: Any, lang: str) -> Any:
    """Update name and description based on language preference."""
    if lang == "ar":
        if place_read_obj.name_ar:
            place_read_obj.name = place_read_obj.name_ar
        if place_read_obj.description_ar:
            place_read_obj.description = place_read_obj.description_ar
    elif lang == "en":
        if place_read_obj.name_en:
            place_read_obj.name = place_read_obj.name_en
        if place_read_obj.description_en:
            place_read_obj.description = place_read_obj.description_en
    return place_read_obj
