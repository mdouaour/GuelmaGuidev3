from zxcvbn import zxcvbn

# Simplified top common passwords list (should be expanded in production)
COMMON_PASSWORDS = {
    "123456", "password", "12345678", "qwerty", "12345", "123456789", "football", 
    "1234", "1234567", "baseball", "monkey", "dragon", "letmein", "pussy", "admin",
    "password123", "shadow", "master", "hello", "test", "welcome", "sunshine",
    "princess", "guilty", "iloveyou", "superman", "jessica", "charlie", "computer",
    "000000", "111111", "222222", "666666", "888888", "999999", "secret"
}

def validate_password_strength(password: str) -> None:
    """
    Validates password strength using zxcvbn and a common password blocklist.
    Raises ValueError if validation fails.
    """
    # 1. Check blocklist
    if password.lower() in COMMON_PASSWORDS:
        raise ValueError("This password is too common and easily guessed")
    
    # 2. Check zxcvbn score
    results = zxcvbn(password)
    score = results.get('score', 0)
    
    if score < 2:
        # Provide suggestions if available
        suggestions = results.get('feedback', {}).get('suggestions', [])
        suggestion_text = f". Suggestions: {', '.join(suggestions)}" if suggestions else ""
        raise ValueError(f"Password is too weak (score {score}/4){suggestion_text}")
