// スケジュールを保持する配列
let schedules = [];
// スケジュールリストのコンテナ要素を取得
const schedulesContainer = document.getElementById('schedules'); 
const mapContainer = document.getElementById('lecture-map-container'); 

// 🌟 開閉状態を記憶するためのグローバルオブジェクト
let openScheduleGroups = {}; 

// 🌟 背景テーマのパス定義
const BACKGROUND_THEMES = {
    nyarlathotep: 'Nyarlathotep_Loop.png', 
    ocean: 'boat-14509_256.gif', 
    snow: 'snowing-3079_256.gif',
    hole: 'lightspeed-10958.gif',
    maru: 'mawaru.gif',
    galaxcy: 'galaxy-6869.gif',
    neko: '35725375_MotionElements_cozy-black-cat-standing-in-the-window-side-rain-c-vimage-2.gif',
    none: null 
};

// 🌟 時間割データ定義
const TIMETABLE_DATA = [
    {
        id: 'c101',
        name: '知能メディアプロジェクト',
        classroom: '食堂棟3階',
        professorPhoto: 'tanabe.png', 
        professorName: 'ALL 先生',
        x: 600, 
        y: 250  
    },
    {
        id: 'c102',
        name: 'デジタルファブリケーション',
        classroom: '7105',
        professorPhoto: 'nakamoto.png',
        professorName: ' 中本 先生', 
        x: 430,
        y: 130
    },
    {
        id: 'c103',
        name: 'スポーツ科学(外)',
        classroom: '茜浜運動場',
        professorPhoto: 'suka.png', 
        professorName: '松井 先生',
        x: 650, 
        y: 100  
    },
    {
        id: 'c104',
        name: 'メディアデザイン論',
        classroom: '7104',
        professorPhoto: 'kobayakawa先生.png',
        professorName: ' 小早川 先生・安藤 先生', 
        x: 410,
        y: 160
    },
    {
        id: 'c105',
        name: '人工知能基礎',
        classroom: '1102',
        professorPhoto: 'mori.png',
        professorName: ' 森 先生', 
        x: 400,
        y: 310
    },
    {
        id: 'c106',
        name: 'メディア基礎',
        classroom: '7103',
        professorPhoto: 'takemoto.png',
        professorName: ' 竹本 先生', 
        x: 450,
        y: 160
    },
    {
        id: 'c107',
        name: 'プログラミング応用',
        classroom: '7104',
        professorPhoto: 'konnno先生.png',
        professorName: ' 今野 先生', 
        x: 430,
        y: 180
    },
    {
        id: 'c108',
        name: '情報デザイン基礎',
        classroom: '12号館5階製図室',
        professorPhoto: 'andou先生.png',
        professorName: ' 安藤 先生・田邊 先生', 
        x: 470,
        y: 310
    },
];

// ----------------------------------------------------
// 【新規追加】時間割画像表示トグル機能
// ----------------------------------------------------

/**
 * 時間割画像（#timetable-image）の表示/非表示を切り替えます。
 */
window.toggleTimetableImage = function() {
    const imgElement = document.getElementById('timetable-image');
    const buttonElement = document.getElementById('timetable-toggle-button');
    
    if (imgElement) {
        const isHidden = imgElement.style.display === 'none';
        
        if (isHidden) {
            imgElement.style.display = 'block';
            if (buttonElement) buttonElement.textContent = '時間割を非表示';
        } else {
            imgElement.style.display = 'none';
            if (buttonElement) buttonElement.textContent = '時間割を表示';
        }
    }
}



/**
 * 予定の完了状態を切り替えます。
 * @param {string} id - 予定のID
 * @param {boolean} isChecked - チェック状態 (true: 完了, false: 未完了)
 */
window.toggleCompletion = function(id, isChecked) {
    const schedule = schedules.find(s => s.id === id);
    if (schedule) {
        schedule.isCompleted = isChecked;
        
        saveSchedules();
        renderSchedules(); 
    }
}



// 🌟 背景変更ロジック
window.changeBackground = function(theme) {
    const body = document.body;
    const buttons = document.querySelectorAll('.bg-button');
    
    let imagePath;
    
    if (theme === 'none') {
        imagePath = 'none';
        body.style.backgroundImage = imagePath;
    } else {
        imagePath = BACKGROUND_THEMES[theme] || BACKGROUND_THEMES.nyarlathotep;
        body.style.backgroundImage = `url('${imagePath}')`;
    }
    
    localStorage.setItem('currentBackgroundTheme', theme);

    buttons.forEach(button => {
        button.classList.remove('active');
        if (button.getAttribute('onclick').includes(`'${theme}'`)) {
            button.classList.add('active');
        }
    });
}

// 🌟 起動時に背景をロードする関数
function loadBackgroundTheme() {
    const savedTheme = localStorage.getItem('currentBackgroundTheme') || 'nyarlathotep';
    changeBackground(savedTheme);
}


// 1. 現在時刻の表示 (毎秒更新)
function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
    document.getElementById('current-time').textContent = timeString;
    
    // 時間が更新されるたびに表示を更新し、色分けをチェック
    renderSchedules(); 
}
// 1秒ごとに更新処理を実行
setInterval(updateTime, 1000); 


// 予定をローカルストレージに保存・読み込みする関数
function saveSchedules() {
    localStorage.setItem('schedules', JSON.stringify(schedules));
}

function loadSchedules() {
    const savedSchedules = localStorage.getItem('schedules');
    if (savedSchedules) {
        schedules = JSON.parse(savedSchedules);
        // 完了状態の初期化/互換性確保
        schedules = schedules.map(s => ({
            id: s.id,
            datetime: s.datetime,
            content: s.content,
            url: s.url || '', 
            memo: s.memo || '', 
            category: s.category || (s.isImportant ? 'important' : 'none'), 
            isCompleted: s.isCompleted === true, // 過去のデータにない場合は false
            // 🌟 【復元】繰り返しプロパティの互換性確保
            isRepeating: s.isRepeating === true, 
        }));
    }
}

// 🌟 日付ヘッダーの開閉機能 
window.toggleScheduleGroup = function(headerElement, dateKey) {
    const ulElement = headerElement.nextElementSibling;
    const todayKey = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' });

    headerElement.classList.toggle('is-open');
    ulElement.classList.toggle('is-open');
    
    if (dateKey === todayKey) {
        if (!headerElement.classList.contains('is-open')) {
             openScheduleGroups[dateKey] = false; 
        } else {
             delete openScheduleGroups[dateKey]; 
        }
    } 
    else {
        if (headerElement.classList.contains('is-open')) {
            openScheduleGroups[dateKey] = true;
        } else {
            delete openScheduleGroups[dateKey];
        }
    }
}

// 予定をリストに表示（日付ごとにグループ化＆時間で色分け＆開閉機能）
function renderSchedules() {
    const now = new Date().getTime();
    
    // 過去5分＋完了済みの予定も表示に残す
    const upcomingSchedules = schedules
        .filter(s => new Date(s.datetime).getTime() >= now - (5 * 60 * 1000) || s.isCompleted) 
        .sort((a, b) => {
            // 完了済みは一番下に並べる
            if (a.isCompleted !== b.isCompleted) {
                return a.isCompleted ? 1 : -1;
            }
            // それ以外は時間順
            return new Date(a.datetime) - new Date(b.datetime);
        }); 

    schedulesContainer.innerHTML = ''; 

    const groupedSchedules = upcomingSchedules.reduce((groups, schedule) => {
        const dateKey = new Date(schedule.datetime).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' });
        
        if (!groups[dateKey]) {
            groups[dateKey] = [];
        }
        groups[dateKey].push(schedule);
        return groups;
    }, {});

    const todayKey = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' });

    for (const dateKey in groupedSchedules) {
        // --- 日付ヘッダーの作成 ---
        const dateHeader = document.createElement('h3');
        dateHeader.textContent = dateKey;
        dateHeader.classList.add('date-header');
        dateHeader.onclick = () => toggleScheduleGroup(dateHeader, dateKey); 
        schedulesContainer.appendChild(dateHeader);

        // --- その日の予定リストの作成 ---
        const dailyUl = document.createElement('ul');
        dailyUl.classList.add('daily-schedule-group');
        
        let shouldBeOpen = false;
        if (dateKey === todayKey) {
            if (openScheduleGroups[dateKey] !== false) {
                shouldBeOpen = true;
            }
        } else if (openScheduleGroups[dateKey]) {
            shouldBeOpen = true;
        }
        
        if (shouldBeOpen) {
            dateHeader.classList.add('is-open');
            dailyUl.classList.add('is-open');
        }

        groupedSchedules[dateKey].forEach(schedule => {
            const listItem = document.createElement('li');
            
            // 完了済みの場合、時間による色分けやカテゴリの強調を上書き
            if (schedule.isCompleted) {
                listItem.classList.add('schedule-item-completed');
            } else {
                // 時間による色分けのロジック (未完了の場合のみ)
                const scheduleTime = new Date(schedule.datetime).getTime();
                const timeDifference = scheduleTime - now; 
                
                const MINUTE = 60 * 1000;
                const HOUR = 60 * MINUTE;
                
                if (timeDifference < 30 * MINUTE) {
                    listItem.classList.add('time-urgent');
                } else if (timeDifference < 2 * HOUR) {
                    listItem.classList.add('time-warning');
                } else if (timeDifference < 4 * HOUR) {
                    listItem.classList.add('time-approaching');
                }
                
                // カテゴリに応じてクラスを付与 (未完了の場合のみ)
                if (schedule.category === 'important') {
                    listItem.classList.add('focus-schedule'); 
                } else if (schedule.category === 'meeting') {
                    listItem.classList.add('meeting-schedule'); 
                }
            }
            
            // 🌟 【復元】繰り返し予定の表示強調
            let repeatTag = '';
            if (schedule.isRepeating) {
                 repeatTag = '<span class="repeat-tag">[週次]</span> ';
                 listItem.classList.add('repeating-schedule');
            }


            const timeOptions = { hour: '2-digit', minute: '2-digit' };
            const formattedTime = new Date(schedule.datetime).toLocaleTimeString('ja-JP', timeOptions);

            const urlHtml = schedule.url 
                ? `<div class="schedule-url-link"><a href="${schedule.url}" target="_blank">🔗 関連リンクへ移動</a></div>` 
                : '';

            const memoHtml = schedule.memo 
                ? `<div class="schedule-memo-text">**メモ/準備物:** ${schedule.memo}</div>` 
                : '';

            listItem.innerHTML = `
                <div class="schedule-item-wrapper">
                    <input type="checkbox" class="schedule-item-checkbox" 
                           id="check-${schedule.id}" 
                           ${schedule.isCompleted ? 'checked' : ''} 
                           onchange="toggleCompletion('${schedule.id}', this.checked)">

                    <div class="schedule-info-main">
                        <div class="schedule-info-content-wrapper">
                            <span class="schedule-time">${formattedTime}</span>
                            ${repeatTag} <span class="schedule-content-text">${schedule.content}</span>
                        </div>
                        <div class="schedule-actions">
                            <button onclick="editSchedule('${schedule.id}')">変更</button>
                            <button onclick="deleteSchedule('${schedule.id}')">削除</button>
                        </div>
                    </div>
                </div>
                ${urlHtml}
                ${memoHtml}
            `;
            dailyUl.appendChild(listItem);
        });

        schedulesContainer.appendChild(dailyUl);
    }
}

// 予定の追加
window.addSchedule = function() {
    const datetimeInput = document.getElementById('schedule-datetime');
    const contentInput = document.getElementById('schedule-content');
    const urlInput = document.getElementById('schedule-url'); 
    const memoInput = document.getElementById('schedule-memo'); 
    const selectedCategory = document.querySelector('input[name="schedule-category"]:checked').value; 
    const repeatCheckbox = document.getElementById('schedule-repeat-weekly'); 
    
    // 🌟 【新規追加】週数入力フィールドから値を取得 🌟
    const repeatWeeksInput = document.getElementById('repeat-weeks');
    const customWeeks = parseInt(repeatWeeksInput.value); // 数値に変換

    const datetimeStr = datetimeInput.value;
    const content = contentInput.value.trim();
    const url = urlInput.value.trim(); 
    const memo = memoInput.value.trim(); 
    const isRepeating = repeatCheckbox ? repeatCheckbox.checked : false; 

    
    if (!datetimeStr || !content) {
        alert('日時と内容をすべて入力してください。');
        return;
    }
    
    // 🌟 【修正されたロジック】 numWeeksの決定 🌟
    let numWeeks = 1;
    if (isRepeating) {
        // 繰り返しがONの場合、カスタム週数を採用。無効な値ならデフォルトの10週に戻す。
        numWeeks = (customWeeks > 0 && customWeeks <= 52) ? customWeeks : 10;
    }

    // 繰り返し予定の生成ロジック
    const schedulesToAdd = [];
    const initialDate = new Date(datetimeStr);

    for (let i = 0; i < numWeeks; i++) { // numWeeks を使用
        const nextDate = new Date(initialDate);
        nextDate.setDate(initialDate.getDate() + (i * 7)); // 7日ずつ加算

        // Dateオブジェクトをdatetime-local形式の文字列に変換
        const pad = (num) => num.toString().padStart(2, '0');
        const formattedDate = `${nextDate.getFullYear()}-${pad(nextDate.getMonth() + 1)}-${pad(nextDate.getDate())}T${pad(nextDate.getHours())}:${pad(nextDate.getMinutes())}`;

        const newSchedule = {
            id: Date.now().toString() + '-' + i, // ユニークIDを確保
            datetime: formattedDate,
            content: content,
            url: url,
            memo: memo, 
            category: selectedCategory, 
            isCompleted: false, 
            isRepeating: isRepeating, 
        };
        schedulesToAdd.push(newSchedule);
    }

    schedules.push(...schedulesToAdd);
    saveSchedules();
    renderSchedules(); 

    // フォームをリセット
    datetimeInput.value = '';
    contentInput.value = '';
    urlInput.value = ''; 
    memoInput.value = ''; 
    document.getElementById('category-none').checked = true; 
    if (repeatCheckbox) repeatCheckbox.checked = false; 
    // 🌟 【新規追加】週数をデフォルトの10に戻す（見た目のリセット）
    repeatWeeksInput.value = '10'; 
}


// 予定の削除
window.deleteSchedule = function(id) {
    if (confirm('この予定を削除しますか？')) {
        schedules = schedules.filter(schedule => schedule.id !== id);
        saveSchedules();
        renderSchedules();
    }
}

// 予定の変更
window.editSchedule = function(id) {
    const scheduleToEdit = schedules.find(schedule => schedule.id === id);
    if (!scheduleToEdit) return;

    const newContent = prompt('新しい予定の内容を入力してください:', scheduleToEdit.content);
    
    if (newContent !== null && newContent.trim() !== '') {
        scheduleToEdit.content = newContent.trim();

        const newUrl = prompt('新しい関連リンクURLを入力してください:', scheduleToEdit.url || '');
        if (newUrl !== null) {
            scheduleToEdit.url = newUrl.trim();
        }
        
        const newMemo = prompt('新しい準備物/メモを入力してください:', scheduleToEdit.memo || '');
        if (newMemo !== null) {
            scheduleToEdit.memo = newMemo.trim();
        }
        
        const currentCategoryName = { 'none': 'なし', 'important': '重要/課題', 'meeting': '会議' }[scheduleToEdit.category] || 'なし';
        const newCategory = prompt(`現在のカテゴリ: ${currentCategoryName}\n新しいカテゴリを入力してください ('important', 'meeting', 'none'):`, scheduleToEdit.category);

        if (['important', 'meeting', 'none'].includes(newCategory)) {
            scheduleToEdit.category = newCategory;
        }

        saveSchedules();
        renderSchedules();
    }
}

// 🌟 マップピン関連のロジック
// 🌟 ピンのHTMLを生成する関数
function createPinHtml(data) {
    return `
        <div class="lecture-pin" style="left: ${data.x}px; top: ${data.y}px;" data-id="${data.id}">
            <div class="pin-photo-container">
                <img src="${data.professorPhoto}" alt="${data.name}担当教授">
            </div>
            <div class="pin-body"></div>
            <div class="pin-details">
                <strong>${data.name}</strong><br>
                <span>${data.classroom}</strong><br>
            <span>担当: ${data.professorName}</span> </div>
            </div>
        </div>
    `;
}

// 🌟 マップにピンを挿入・表示する関数
let pinsVisible = false;

function toggleLecturePins(event) {
    const mapImage = document.getElementById('campus-map-image');

    // ピン要素、またはマップ画像以外の場所がクリックされた場合は処理をスキップ
    if (event.target.closest('.lecture-pin') || (mapImage && event.target !== mapImage)) {
        return;
    }
    
    if (!mapImage) {
        console.error("Error: Map image element 'campus-map-image' not found.");
        return;
    }

    if (pinsVisible) {
        // 既存のピンを削除
        document.querySelectorAll('.lecture-pin').forEach(pin => pin.remove());
        pinsVisible = false;
    } else {
        // ピンを生成し、マップに追加
        TIMETABLE_DATA.forEach(lecture => {
            const pinHtml = createPinHtml(lecture);
            mapContainer.insertAdjacentHTML('beforeend', pinHtml);
        });
        pinsVisible = true;
        
        // アニメーションで表示
        setTimeout(() => {
            document.querySelectorAll('.lecture-pin').forEach(pin => {
                pin.classList.add('is-visible');
                pin.addEventListener('click', togglePinDetails);
            });
        }, 50); 
    }
}

// 🌟 ピンの詳細表示を切り替える関数
function togglePinDetails(event) {
    // 他のピンの詳細を閉じる
    document.querySelectorAll('.lecture-pin .pin-details').forEach(detail => {
        if (detail.parentNode !== event.currentTarget) {
            detail.style.display = 'none';
        }
    });

    // 自分の詳細をトグル
    const details = event.currentTarget.querySelector('.pin-details');
    details.style.display = details.style.display === 'block' ? 'none' : 'block';

    // マップ全体クリック時の動作と重複しないようにイベント伝播を停止
    event.stopPropagation();
}

// ----------------------------------------------------
// 【初期化処理】
// ----------------------------------------------------

// ページロード時に実行
loadSchedules();
renderSchedules();
loadBackgroundTheme(); 
updateTime(); // 最初の時刻表示

// マップ画像をクリックしたらピンを表示/非表示
const mapImage = document.getElementById('campus-map-image');
if (mapImage) {
     mapImage.addEventListener('click', toggleLecturePins);
} else if (mapContainer) {
     mapContainer.addEventListener('click', toggleLecturePins);
}