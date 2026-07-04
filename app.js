const QuizApp = {
    idx: 0,
    record: [],
    currentCardNode: null,
    isAnimating: false,
    activeBank: [],
    touchStartX: 0,
    touchStartY: 0,

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    },

    start(isRandom) {
        this.activeBank = [...QUESTION_BANK];
        if (isRandom) this.shuffle(this.activeBank);

        const home = document.getElementById("home");
        const app = document.getElementById("app");

        home.style.transform = "scale(0.94)";
        home.style.opacity = "0";

        setTimeout(() => {
            home.style.display = "none";
            app.style.display = "flex";
            void app.offsetWidth;

            app.style.opacity = "1";
            app.style.transform = "scale(1)";

            this.idx = 0;
            this.record = new Array(this.activeBank.length).fill(null);
            document.getElementById("progress").style.width = "0%";
            document.getElementById("top").innerText = "正确率 0%";

            this.render("pop");
            this.renderGrid();
        }, 400);
    },

    render(animationType = "next") {
        if (this.isAnimating) return;
        this.isAnimating = true;

        const viewport = document.getElementById("viewport");
        const q = this.activeBank[this.idx];

        // 同步更新右上角极客风格的计数器
        const currentNumStr = String(this.idx + 1).padStart(2, '0');
        const totalNumStr = String(this.activeBank.length).padStart(2, '0');
        document.getElementById("nav-counter").innerText = `${currentNumStr} / ${totalNumStr}`;

        const newCard = document.createElement("div");
        let inClass, outClass;

        if (animationType === "next") {
            inClass = "slide-in-right"; outClass = "slide-out-left";
        } else if (animationType === "prev") {
            inClass = "slide-in-left"; outClass = "slide-out-right";
        } else {
            inClass = "pop-in"; outClass = "pop-out";
        }

        newCard.className = "card " + inClass;

        // 【高级感核心】智能文本分析拆解：将 "A. 选项内容" 智能转换为语义化标签
        let optionsHTML = q.opts.map((o, i) => {
            let cls = "opt";
            if (this.record[this.idx] !== null) {
                if (i === q.a) cls += " correct";
                else if (i === this.record[this.idx]) cls += " wrong";
            }
            
            // 解析前缀
            let optionLetter = "•";
            let optionContent = o;
            const dotIndex = o.indexOf(".");
            if(dotIndex > 0 && dotIndex < 4) {
                optionLetter = o.substring(0, dotIndex).trim();
                optionContent = o.substring(dotIndex + 1).trim();
            }

            return `
                <div class="${cls}" onclick="QuizApp.selectOpt(this, ${i})">
                    <div class="opt-badge">${optionLetter}</div>
                    <div class="opt-text">${optionContent}</div>
                </div>
            `;
        }).join("");

        let returnBtnHTML = '';
        if (this.idx === this.activeBank.length - 1) {
            returnBtnHTML = `
                <div class="home-btn-wrap" style="opacity: ${this.record[this.idx] !== null ? '1' : '0'};">
                    <button class="btn btn-secondary" style="padding: 12px 24px; font-size: 14px; margin-top:20px;" onclick="QuizApp.returnHome()">返回系统首页</button>
                </div>
            `;
        }

        newCard.innerHTML = `
            <div class="qnum">QUESTION ${currentNumStr}</div>
            <div class="q">${q.q}</div>
            ${optionsHTML}
            ${returnBtnHTML}
        `;

        if (this.currentCardNode) {
            const oldCard = this.currentCardNode;
            oldCard.className = "card " + outClass;
            setTimeout(() => { if (oldCard.parentNode) oldCard.parentNode.removeChild(oldCard); }, 550);
        }

        viewport.appendChild(newCard);
        this.currentCardNode = newCard;
        
        // 进度条微光同步
        document.getElementById("progress").style.width = ((this.idx + 1) / this.activeBank.length * 100) + "%";
        document.getElementById("top").innerText = "正确率 " + this.calculateAccuracy() + "%";
        
        setTimeout(() => { this.isAnimating = false; }, 550);
    },

    selectOpt(element, i) {
        if (this.isAnimating) return;
        const q = this.activeBank[this.idx];
        const opts = element.parentNode.querySelectorAll(".opt");

        if (this.record[this.idx] !== null) return;

        this.record[this.idx] = i;

        if (i === q.a) {
            element.classList.add("correct");
        } else {
            element.classList.add("wrong");
            opts[q.a].classList.add("correct");
        }

        document.getElementById("top").innerText = "正确率 " + this.calculateAccuracy() + "%";
        this.renderGrid();

        if (this.idx === this.activeBank.length - 1) {
            const btnWrap = element.parentNode.querySelector('.home-btn-wrap');
            if (btnWrap) btnWrap.style.opacity = '1';
        } else {
            setTimeout(() => {
                if (this.idx < this.activeBank.length - 1) {
                    this.idx++;
                    this.render("next");
                    this.renderGrid();
                }
            }, 900); // 略微延长给足霓虹发光视觉反馈的时间
        }
    },

    calculateAccuracy() {
        let answered = this.record.filter(x => x !== null).length;
        let correctCount = 0;
        this.record.forEach((val, index) => {
            if (val !== null && val === this.activeBank[index].a) correctCount++;
        });
        return answered ? Math.round(correctCount / answered * 100) : 0;
    },

    renderGrid() {
        const grid = document.getElementById("grid");
        grid.innerHTML = "";
        for (let i = 0; i < this.activeBank.length; i++) {
            const btn = document.createElement("div");
            btn.className = "qbtn";
            if (this.record[i] !== null) {
                if (this.record[i] === this.activeBank[i].a) btn.classList.add("y");
                else btn.classList.add("n");
            }
            btn.innerText = String(i + 1).padStart(2, '0');
            btn.onclick = () => {
                if (this.idx === i) { this.closePanel(); return; }
                this.idx = i;
                this.render("pop");
                this.closePanel();
            };
            grid.appendChild(btn);
        }
    },

    returnHome() {
        if (this.isAnimating) return;
        const home = document.getElementById("home");
        const app = document.getElementById("app");

        app.style.opacity = "0";
        app.style.transform = "scale(0.97)";

        setTimeout(() => {
            app.style.display = "none";
            home.style.display = "flex";
            void home.offsetWidth;
            home.style.opacity = "1";
            home.style.transform = "scale(1)";
        }, 600);
    },

    togglePanel() {
        document.getElementById("panel").classList.toggle("show");
        document.getElementById("mask").classList.toggle("show");
    },
    closePanel() {
        document.getElementById("panel").classList.remove("show");
        document.getElementById("mask").classList.remove("show");
    },

    triggerEdgeBounce(direction) {
        if (this.currentCardNode && !this.isAnimating) {
            this.currentCardNode.className = "card";
            void this.currentCardNode.offsetWidth;
            this.currentCardNode.classList.add(direction === 'left' ? 'edge-bounce-left' : 'edge-bounce-right');
        }
    },

    initTouchEvents() {
        const viewport = document.getElementById('viewport');
        
        viewport.addEventListener('touchstart', e => {
            if (this.isAnimating) return;
            this.touchStartX = e.changedTouches[0].clientX;
            this.touchStartY = e.changedTouches[0].clientY;
        }, { passive: true });

        viewport.addEventListener('touchend', e => {
            if (this.isAnimating) return;
            const diffX = e.changedTouches[0].clientX - this.touchStartX;
            const diffY = e.changedTouches[0].clientY - this.touchStartY;

            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40) {
                if (diffX > 0 && this.idx > 0) {
                    this.idx--; this.render("prev"); this.renderGrid();
                } else if (diffX < 0 && this.idx < this.activeBank.length - 1) {
                    this.idx++; this.render("next"); this.renderGrid();
                } else {
                    this.triggerEdgeBounce(diffX > 0 ? 'right' : 'left');
                }
            }
        }, { passive: true });
    }
};

document.addEventListener("DOMContentLoaded", () => {
    QuizApp.initTouchEvents();
});