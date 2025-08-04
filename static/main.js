import { setupUI, setupEventListeners, showMainMenu } from './modules/ui.js';
import * as pdfOps from './modules/pdf-operations.js';
import { initBackground } from './modules/background.js'; // ### 신규: 배경 모듈 임포트

function initializeApp() {
    // 메인 메뉴 버튼들에 이벤트 리스너 추가
    document.querySelectorAll('.menu-button').forEach(button => {
        button.addEventListener('click', () => {
            const operation = button.dataset.operation;
            setupUI(operation, pdfOps);
        });
    });

    // 홈 버튼 이벤트 리스너
    document.getElementById('home-button').addEventListener('click', showMainMenu);

    // 파일 입력 관련 이벤트 리스너 설정
    setupEventListeners();

    // ### 신규: 배경 애니메이션 초기화 ###
    initBackground();
}

// 앱 초기화
document.addEventListener('DOMContentLoaded', initializeApp);
