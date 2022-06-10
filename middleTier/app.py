#!/usr/bin/python3
from flask import Flask, request
 
app = Flask(__name__)


# 获取用户代理
@ app.route("/")
def agent_show():
    user_agent = request.headers.get("User-Agent")
    message = "<h1>User Agent</h1>\n<p>Your user agent is: %s</p>" % user_agent
    return message
 
 
 
if __name__ == "__main__":
    app.run()
