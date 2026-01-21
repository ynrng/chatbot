# import requests
from playwright.sync_api import sync_playwright
import requests

# session = requests.Session()

login_payload = {
    "email": "suga_e@outlook.com",
    "password": "TiQk87.3AyiiA@q"
}

# session.post("https://www.buytickets.scotrail.co.uk/login-service/api/login", data=login_payload)

# r = session.get("https://www.buytickets.scotrail.co.uk/my-account/api/bookings/past?page=0")
# print(r.text)



def get_cookies():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()

        page.goto("https://www.buytickets.scotrail.co.uk/my-account/login")
        page.fill("#signin-email", login_payload.get("email"))
        page.fill("#signin-password", login_payload.get("password"))
        button = page.locator('div[data-testid="sign-in-form"] >> button[type=submit]')
        allowall = None
        while not allowall:
            allowall = page.wait_for_selector('#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll', timeout=5000, state="visible")

        allowall.click(timeout=5000)
        button.click()


        # page.wait_for_url("https://www.buytickets.scotrail.co.uk/my-account/bookings/upcoming")
        page.wait_for_load_state("networkidle")

        cookies = context.cookies()
        browser.close()

        print(cookies)

        return cookies


def cookies_to_dict(cookies):
    return {c["name"]: c["value"] for c in cookies}

def main():
    cookies = cookies_to_dict(get_cookies())

    r = requests.get(
        "https://www.buytickets.scotrail.co.uk/my-account/api/bookings/past?page=0",
        cookies=cookies,
        headers={
            "User-Agent": "Mozilla/5.0"
        }
    )

    print(r.json())

main()


# with sync_playwright() as p:
#     browser = p.chromium.launch(headless=True)
#     page = browser.new_page()
#     page.goto("https://www.buytickets.scotrail.co.uk/my-account/login")

#     page.fill("#signin-email", login_payload.get("email"))
#     page.fill("#signin-password", login_payload.get("password"))
#     page.click("button[type=submit]")

#     page.wait_for_url("https://www.buytickets.scotrail.co.uk/my-account/bookings/upcoming")


#     page.wait_for_url("https://www.buytickets.scotrail.co.uk/my-account/bookings/past")
#     cookies = page.context.cookies()
