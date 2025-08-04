# Flask 라이브러리에서 필요한 기능을 가져옵니다.
from flask import Flask, render_template

# Flask 애플리케이션 객체를 생성합니다.
# static_url_path=''와 static_folder='static' 설정은
# Flask가 'static' 폴더를 올바르게 인식하도록 보장합니다.
app = Flask(__name__, static_url_path='', static_folder='static')

# 사용자가 웹사이트의 기본 주소('/')로 접속했을 때 실행될 함수를 정의합니다.
@app.route('/')
def index():
    """
    'index.html' 템플릿을 렌더링하여 사용자에게 보여줍니다.
    Flask는 기본적으로 'templates' 폴더 안에서 HTML 파일을 찾습니다.
    """
    return render_template('index.html')

# 이 스크립트가 직접 실행될 때만 웹 서버를 구동합니다.
if __name__ == '__main__':
    """
    app.run()을 호출하여 개발용 웹 서버를 시작합니다.
    debug=True 옵션은 코드가 변경될 때마다 서버를 자동으로 재시작해주어 편리합니다.
    host='0.0.0.0'은 로컬 네트워크의 다른 기기에서도 접속할 수 있게 합니다.
    """
    app.run(host='0.0.0.0', port=5000, debug=True)
