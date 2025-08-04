// --- DOM 요소 ---
export const elements = {
    mainMenu: document.getElementById('main-menu'),
    operationView: document.getElementById('operation-view'),
    operationTitle: document.getElementById('operation-title'),
    homeButton: document.getElementById('home-button'),
    fileDropZone: document.getElementById('file-drop-zone'),
    fileInput: document.getElementById('file-input'),
    fileLabel: document.getElementById('file-label'),
    fileList: document.getElementById('file-list'),
    fileInputContainer2: document.getElementById('file-input-container-2'),
    fileInput2: document.getElementById('file-input-2'),
    fileLabel2: document.getElementById('file-label-2'),
    additionalInputs: document.getElementById('additional-inputs'),
    inputLabel: document.getElementById('input-label'),
    textInput: document.getElementById('text-input'),
    applyButton: document.getElementById('apply-button'),
    statusContainer: document.getElementById('status-container'),
    statusMessage: document.getElementById('status-message'),
    progressBarContainer: document.getElementById('progress-bar-container'),
    progressBar: document.getElementById('progress-bar'),
    logContainer: document.getElementById('log-container'),
    logOutput: document.getElementById('log-output'),
    previewContainer: document.getElementById('preview-container'),
    previewArea: document.getElementById('preview-area'),
    previewPlaceholder: document.getElementById('preview-placeholder'),
    toastContainer: document.getElementById('toast-container'),
    controlPane: document.getElementById('control-pane')
};

let currentOperation = null;
let sortable = null;

// --- 이벤트 리스너 설정 ---
export function setupEventListeners() {
    elements.fileDropZone.addEventListener('click', () => elements.fileInput.click());
    elements.fileDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.fileDropZone.classList.add('dragover');
    });
    elements.fileDropZone.addEventListener('dragleave', () => elements.fileDropZone.classList.remove('dragover'));
    elements.fileDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        elements.fileDropZone.classList.remove('dragover');
        elements.fileInput.files = e.dataTransfer.files;
        handleFileSelection(elements.fileInput.files);
    });
    elements.fileInput.addEventListener('change', () => handleFileSelection(elements.fileInput.files));
}

function handleFileSelection(files) {
    if (files.length === 0) return;
    elements.fileList.textContent = Array.from(files).map(f => f.name).join(', ');

    const operationsWithPdfPreview = ['extract', 'deleteReorder', 'addWatermark', 'compress'];
    if (operationsWithPdfPreview.includes(currentOperation) && files[0].type === 'application/pdf') {
        displayPdfPreview(files[0]);
    } else if (currentOperation === 'imageToPdf') {
        displayImagePreview(files);
    }
}

// --- UI 관리 함수 ---
export function setupUI(operation, pdfOps) {
    currentOperation = operation;
    elements.mainMenu.classList.add('hidden');
    elements.operationView.classList.remove('hidden');
    elements.homeButton.classList.remove('hidden');
    
    // UI 초기화
    elements.fileInput.value = '';
    elements.fileInput2.value = '';
    elements.textInput.value = '';
    elements.fileList.textContent = '';
    elements.fileInput.removeAttribute('multiple');
    elements.fileInput.accept = 'application/pdf';
    elements.fileInputContainer2.classList.add('hidden');
    elements.additionalInputs.classList.add('hidden');
    elements.previewArea.innerHTML = '';
    elements.previewPlaceholder.classList.remove('hidden');
    elements.textInput.type = 'text';

    elements.operationTitle.className = 'text-2xl font-bold text-blue-800 mb-4 p-4 bg-blue-100 rounded-lg text-center';
    log(`새로운 작업을 시작합니다: ${operation}`);

    const operationsWithPreview = ['extract', 'deleteReorder', 'addWatermark', 'compress', 'imageToPdf'];
    
    // 레이아웃 제어 로직
    if (operationsWithPreview.includes(operation)) {
        elements.previewContainer.classList.remove('hidden');
        elements.controlPane.classList.remove('md:w-full');
        elements.controlPane.classList.add('md:w-1/3');
    } else {
        elements.previewContainer.classList.add('hidden');
        elements.controlPane.classList.remove('md:w-1/3');
        elements.controlPane.classList.add('md:w-full');
    }

    const operationConfig = {
        merge: { title: 'PDF 파일 합치기', label: '여기에 PDF 파일들을 드롭하거나 클릭하여 선택', multiple: true, action: pdfOps.mergePdfs },
        extract: { title: '페이지 추출', inputs: true, label: '추출할 페이지를 선택하거나 직접 입력하세요.', placeholder: '예: 1, 3-5, 8', action: pdfOps.extractPages },
        deleteReorder: { title: '페이지 삭제/순서 변경', inputs: true, label: '페이지 순서를 드래그하거나, 삭제할 페이지를 선택하세요.', placeholder: '삭제할 페이지는 클릭하여 선택', action: pdfOps.deleteReorderPages },
        addWatermark: { title: '워터마크 추가', inputs: true, label: '추가할 워터마크 텍스트를 입력하세요.', placeholder: '예: CONFIDENTIAL', action: pdfOps.addWatermark },
        imageToPdf: { title: '이미지를 PDF로 변환', label: '여기에 이미지 파일(JPG, PNG)들을 드롭하거나 클릭', accept: 'image/jpeg, image/png', multiple: true, action: pdfOps.imagesToPdf },
        compress: { title: 'PDF 압축', inputs: true, label: '압축 품질 (1-100, 낮을수록 용량 작아짐)', type: 'number', value: '75', action: pdfOps.compressPdf },
        unlock: { title: 'PDF 암호 해제', inputs: true, label: 'PDF 암호를 입력하세요.', type: 'password', action: pdfOps.unlockPdf },
        addCover: { title: '표지 추가', cover: true, label: '본문 PDF 파일을 선택하세요', action: pdfOps.addCover }
    };

    const config = operationConfig[operation];
    if (!config) return;

    elements.operationTitle.textContent = config.title;
    elements.fileLabel.textContent = config.label || '여기에 파일을 드롭하거나 클릭하여 선택';
    
    if (config.multiple) elements.fileInput.setAttribute('multiple', true);
    if (config.accept) elements.fileInput.accept = config.accept;
    if (config.inputs) {
        elements.additionalInputs.classList.remove('hidden');
        elements.inputLabel.textContent = config.label;
        elements.textInput.placeholder = config.placeholder || '';
        elements.textInput.type = config.type || 'text';
        elements.textInput.value = config.value || '';
    }
    if (config.cover) {
        elements.fileInputContainer2.classList.remove('hidden');
        elements.fileLabel2.textContent = config.label;
    }
    elements.applyButton.onclick = config.action;
}

export function showMainMenu() {
    elements.operationView.classList.add('hidden');
    elements.homeButton.classList.add('hidden');
    elements.mainMenu.classList.remove('hidden');
    hideStatus();
    elements.logContainer.classList.add('hidden');
    elements.logOutput.textContent = '';
    elements.operationTitle.className = 'text-2xl font-bold text-gray-700 mb-4';
}

export function showStatus(message) {
    elements.statusMessage.textContent = message;
    elements.statusContainer.classList.remove('hidden');
    elements.operationView.classList.add('hidden');
    elements.mainMenu.classList.add('hidden');
}

export function hideStatus() {
    elements.statusContainer.classList.add('hidden');
    elements.progressBarContainer.classList.add('hidden');
}

export function updateProgress(value, total) {
    const percent = Math.round((value / total) * 100);
    elements.progressBarContainer.classList.remove('hidden');
    elements.progressBar.style.width = `${percent}%`;
    elements.progressBar.textContent = `${percent}%`;
}

export function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    elements.toastContainer.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// --- 미리보기 기능 ---
async function displayPdfPreview(file) {
    elements.previewArea.innerHTML = '<p class="col-span-full text-center text-gray-500">미리보기 생성 중...</p>';
    elements.previewPlaceholder.classList.add('hidden');

    try {
        const pdfBytes = await (await fetch(URL.createObjectURL(file))).arrayBuffer();
        const pdfDoc = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
        elements.previewArea.innerHTML = '';

        for (let i = 1; i <= pdfDoc.numPages; i++) {
            const page = await pdfDoc.getPage(i);
            const viewport = page.getViewport({ scale: 0.4 });
            const pageDiv = document.createElement('div');
            pageDiv.className = 'preview-page p-1 rounded-lg shadow';
            pageDiv.dataset.pageNumber = i;
            const canvas = document.createElement('canvas');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            const pageNumberLabel = document.createElement('p');
            pageNumberLabel.className = 'text-center text-xs font-bold mb-1';
            pageNumberLabel.textContent = `Page ${i}`;
            pageDiv.append(canvas, pageNumberLabel);
            elements.previewArea.appendChild(pageDiv);
            await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
            pageDiv.addEventListener('click', () => {
                pageDiv.classList.toggle('selected');
                updateTextInputFromSelection();
            });
        }
        
        if (currentOperation === 'deleteReorder') {
            if (sortable) sortable.destroy();
            sortable = new Sortable(elements.previewArea, { animation: 150, ghostClass: 'sortable-ghost', onEnd: () => updateTextInputFromSelection(true) });
        }
    } catch (e) {
        elements.previewArea.innerHTML = `<p class="col-span-full text-center text-red-500">미리보기 오류: ${e.message}</p>`;
        log(`미리보기 오류: ${e.message}`);
    }
}

async function displayImagePreview(files) {
    elements.previewArea.innerHTML = '';
    elements.previewPlaceholder.classList.add('hidden');
    for(const file of files) {
        const pageDiv = document.createElement('div');
        pageDiv.className = 'preview-page p-1 rounded-lg shadow';
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        pageDiv.appendChild(img);
        elements.previewArea.appendChild(pageDiv);
    }
}

function updateTextInputFromSelection(isReorder = false) {
    const selectedPages = Array.from(elements.previewArea.querySelectorAll('.preview-page.selected')).map(p => p.dataset.pageNumber).join(',');
    const allPages = Array.from(elements.previewArea.querySelectorAll('.preview-page')).map(p => p.dataset.pageNumber).join(',');

    if (currentOperation === 'extract') {
        elements.textInput.value = selectedPages;
    } else if (currentOperation === 'deleteReorder') {
        elements.textInput.value = isReorder ? `순서 변경: ${allPages}` : `삭제: ${selectedPages}`;
    }
}

function log(message) {
    elements.logContainer.classList.remove('hidden');
    elements.logOutput.textContent += `[${new Date().toLocaleTimeString()}] ${message}\n`;
    elements.logOutput.scrollTop = elements.logOutput.scrollHeight;
}
