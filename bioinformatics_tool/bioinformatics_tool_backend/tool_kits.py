import re


def accurate_padding(data):
    if is_base64(data):
        padding_needed = 4 - len(data) % 4
        if padding_needed != 4:
            data += '=' * padding_needed
    else:
        data = data.encode()
    return data

def is_base64(s):
    pattern = re.compile(r'^[A-Za-z0-9+/]+[=]{0,2}$')
    return pattern.match(s)
