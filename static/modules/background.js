const canvas = document.getElementById('background-canvas');
const ctx = canvas.getContext('2d');
let particlesArray;

// 캔버스 크기를 창 크기에 맞게 설정
function setCanvasSize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// 개별 입자(Particle) 클래스 정의
class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 1; // 1px ~ 3px 크기
        this.speedX = Math.random() * 1 - 0.5; // 좌우 이동 속도
        this.speedY = Math.random() * 1 - 0.5; // 상하 이동 속도
        this.color = 'rgba(255, 255, 255, 0.8)';
    }
    // 위치 업데이트
    update() {
        // 화면 가장자리에 닿으면 방향 전환
        if (this.x > canvas.width || this.x < 0) {
            this.speedX = -this.speedX;
        }
        if (this.y > canvas.height || this.y < 0) {
            this.speedY = -this.speedY;
        }
        this.x += this.speedX;
        this.y += this.speedY;
    }
    // 입자 그리기
    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 입자 배열 생성
function initParticles() {
    particlesArray = [];
    // 화면 크기에 비례하여 입자 수 조절
    let numberOfParticles = (canvas.height * canvas.width) / 9000;
    for (let i = 0; i < numberOfParticles; i++) {
        particlesArray.push(new Particle());
    }
}

// 애니메이션 루프
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
        particlesArray[i].draw();
    }
    requestAnimationFrame(animate);
}

// 배경 초기화 함수
export function initBackground() {
    setCanvasSize();
    initParticles();
    animate();

    // 창 크기가 변경될 때마다 캔버스 크기와 입자 다시 설정
    window.addEventListener('resize', () => {
        setCanvasSize();
        initParticles();
    });
}
