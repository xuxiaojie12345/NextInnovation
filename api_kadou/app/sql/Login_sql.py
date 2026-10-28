from sqlalchemy import text

SQL_GET_JN_USER_TABLE = text("""
    SELECT user_id, shimei, yakushoku_kubun, department_id
    FROM `JN_USER_TABLE`
    WHERE user_id = :userId
    AND password = :password
""")