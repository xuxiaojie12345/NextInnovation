"""パスワードのハッシュ化・照合（PBKDF2-SHA256）"""
import hashlib
import secrets

ALGORITHM = "pbkdf2_sha256"
ITERATIONS = 120000


def hash_password(password: str) -> str:
    """パスワードを PBKDF2-SHA256 でハッシュ化する（salt はランダム生成）"""
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), bytes.fromhex(salt), ITERATIONS
    )
    return f"{ALGORITHM}${ITERATIONS}${salt}${digest.hex()}"


def verify_password(password: str, encoded: str) -> bool:
    """保存済みハッシュとパスワードを照合する"""
    try:
        algorithm, iterations, salt, expected = encoded.split("$", 3)
        if algorithm != ALGORITHM:
            return False
        digest = hashlib.pbkdf2_hmac(
            "sha256", password.encode("utf-8"), bytes.fromhex(salt), int(iterations)
        )
        return secrets.compare_digest(digest.hex(), expected)
    except (ValueError, TypeError):
        return False
