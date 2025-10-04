# backend/api/utils/sendAdminNotificationEmail.py
import smtplib
import sys
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

ADMIN_EMAIL = "hr.esepaper@gmail.com"
FROM_EMAIL = os.getenv("GMAIL_USER")
FROM_PASSWORD = os.getenv("GMAIL_APP_PASS")

# Check if required environment variables are set
if not FROM_EMAIL:
    print("WARNING: GMAIL_USER environment variable not set")
    print("Email notification will be skipped")
    sys.exit(0)  # Exit successfully to not break the main process

if not FROM_PASSWORD:
    print("WARNING: GMAIL_APP_PASS environment variable not set")
    print("Email notification will be skipped")
    sys.exit(0)  # Exit successfully to not break the main process

if len(sys.argv) < 3:
    print("Usage: python sendAdminNotificationEmail.py <subject> <message>")
    sys.exit(0)  # Exit successfully to not break the main process

subject = sys.argv[1]
message_body = sys.argv[2]

try:
    s = smtplib.SMTP('smtp.gmail.com', 587)
    s.starttls()
    s.login(FROM_EMAIL, FROM_PASSWORD)

    msg = MIMEMultipart()
    msg["From"] = f"ESE Paper Trading <{FROM_EMAIL}>"
    msg["To"] = ADMIN_EMAIL
    msg["Subject"] = subject

    # UTF-8 body to support ₹ etc.
    msg.attach(MIMEText(message_body, "plain", "utf-8"))

    s.sendmail(FROM_EMAIL, ADMIN_EMAIL, msg.as_string())
    s.quit()
    print("Email sent to admin successfully.")
except Exception as e:
    print(f"Failed to send email: {e}")
    # Don't exit with error code to avoid breaking the main process
    sys.exit(0)












# import smtplib
# import sys
# import os

# # Set default admin email
# ADMIN_EMAIL = "hr.esepaper@gmail.com"
# FROM_EMAIL = os.getenv("GMAIL_USER")
# FROM_PASSWORD = os.getenv("GMAIL_APP_PASS")

# if not FROM_EMAIL or not FROM_PASSWORD:
#     print("❌ Missing GMAIL_USER or GMAIL_APP_PASS in .env")
#     sys.exit(1)

# if len(sys.argv) < 3:
#     print("Usage: python sendAdminNotificationEmail.py <subject> <message>")
#     sys.exit(1)

# subject = sys.argv[1]
# message_body = sys.argv[2]

# try:
#     s = smtplib.SMTP('smtp.gmail.com', 587)
#     s.starttls()
#     s.login(FROM_EMAIL, FROM_PASSWORD)

#     message = f"From: ESE Paper Trading <{FROM_EMAIL}>\nTo: {ADMIN_EMAIL}\nSubject: {subject}\n\n{message_body}"
#     s.sendmail(FROM_EMAIL, ADMIN_EMAIL, message)
#     s.quit()
#     print("✅ Email sent to admin successfully.")
# except Exception as e:
#     print(f"❌ Failed to send email: {e}")
#     sys.exit(1)



