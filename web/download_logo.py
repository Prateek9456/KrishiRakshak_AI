import urllib.request

url = "https://upload.wikimedia.org/wikipedia/en/thumb/0/05/Indian_Council_of_Agricultural_Research_logo.svg/512px-Indian_Council_of_Agricultural_Research_logo.svg.png"
req = urllib.request.Request(
    url, 
    data=None, 
    headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
)

with urllib.request.urlopen(req) as response, open('public/images/icar-logo.png', 'wb') as out_file:
    data = response.read()
    out_file.write(data)

print("Downloaded successfully.")
