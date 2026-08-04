(function(){
  function addStyle(){
    var s = document.createElement('style');
    s.textContent = '#listen-player{background:#fff;border:2px solid #f1f5f9;border-radius:22px;padding:18px 20px;margin-bottom:24px;text-align:center}#listen-player .lp-date{font-size:11px;color:#94a3b8;letter-spacing:.05em;font-weight:700}#listen-player .lp-title{font-size:18px;font-weight:900;margin:4px 0 2px;line-height:1.3}#listen-player .lp-ref{font-size:12px;color:#64748b}#listen-player .lp-chapters{display:flex;gap:6px;justify-content:center;margin:12px 0 4px}#listen-player .lp-chapters button{flex:1;max-width:50px;height:4px;border-radius:2px;border:none;background:#e2e8f0;padding:0;cursor:pointer}#listen-player .lp-chapters button.active{background:#1a1a1a}#listen-player .lp-chapters button.done{background:#94a3b8}#listen-player .lp-chapter-label{font-size:11px;color:#94a3b8;margin-bottom:10px}#listen-player .lp-controls{display:flex;align-items:center;justify-content:center;gap:20px}#listen-player .lp-controls button{background:none;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#1a1a1a}#listen-player .lp-play{width:44px;height:44px;border-radius:50%;background:#1a1a1a;color:#fff}#listen-player .lp-play svg{width:20px;height:20px}#listen-player .lp-speed{display:flex;justify-content:center;gap:6px;margin-top:10px}#listen-player .lp-speed button{font-size:11px;padding:3px 10px;border-radius:20px;border:1px solid #e2e8f0;background:none;color:#64748b;cursor:pointer}#listen-player .lp-speed button.active{border-color:#1a1a1a;color:#1a1a1a;font-weight:700}#listen-player .lp-status{font-size:11px;color:#94a3b8;text-align:center;margin-top:8px;min-height:14px}.history-toggle-row{cursor:pointer;text-align:center;font-size:12px;color:#64748b;border:1px solid #e2e8f0;border-radius:999px;padding:10px;margin:16px 0;background:#fafafa}.history-toggle-row:hover{background:#f1f5f9}.history-collapsed{max-height:34px;overflow:hidden;cursor:pointer;position:relative;padding-top:8px!important;padding-bottom:8px!important;margin-top:4px!important;transition:max-height .2s ease}.history-collapsed *{display:none!important}.history-collapsed::before{content:attr(data-collapsed-label);display:block!important;font-size:12px;color:#94a3b8}.history-collapsed::after{content:"点击展开";display:block!important;position:absolute;top:8px;right:20px;font-size:11px;color:#cbd5e1}';
    document.head.appendChild(s);
  }
  function buildPlayer(){
    var el = document.createElement('div');
    el.id = 'listen-player';
    el.innerHTML = '<div class="lp-date" id="lp-date">加载中...</div><div class="lp-title" id="lp-title"></div><div class="lp-ref" id="lp-ref"></div><div class="lp-chapters" id="lp-chapters"></div><div class="lp-chapter-label" id="lp-chapter-label"></div><div class="lp-controls"><button id="lp-prev" aria-label="上一段"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg></button><button class="lp-play" id="lp-play" aria-label="播放"><svg id="lp-play-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></button><button id="lp-next" aria-label="下一段"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16 6h2v12h-2zM6 6v12l8.5-6z"/></svg></button></div><div class="lp-speed" id="lp-speed"><button data-speed="0.85">0.85x</button><button data-speed="1" class="active">1x</button><button data-speed="1.15">1.15x</button></div><div class="lp-status" id="lp-status">加载今天的经文中...</div>';
    return el;
  }
  function hideSidebars(){
    var nav = document.querySelector('nav.w-72');
    var aside = document.querySelector('aside.w-72');
    if(nav) nav.style.display = 'none';
    if(aside) aside.style.display = 'none';
  }
  var historyBusy = false;
  function setupHistory(feed){
    if(historyBusy) return;
    historyBusy = true;
    var all = Array.prototype.slice.call(feed.children).filter(function(el){ return el.id !== 'history-toggle-row'; });
    if(all.length===0){ historyBusy = false; return; }
    all[0].classList.remove('history-collapsed');
    all[0].style.display = '';
    all[0].style.marginTop = '';
    var rest = all.slice(1);
    var toggle = document.getElementById('history-toggle-row');
    if(!toggle && rest.length>0){
      toggle = document.createElement('div');
      toggle.id = 'history-toggle-row';
      toggle.className = 'history-toggle-row';
      feed.insertBefore(toggle, rest[0]);
      toggle.onclick = function(){
        var open = feed.classList.toggle('history-open');
        rest.forEach(function(card){ card.style.display = open ? '' : 'none'; });
        refreshToggleText();
      };
    }
    function refreshToggleText(){
      if(!toggle) return;
      var open = feed.classList.contains('history-open');
      toggle.textContent = open ? '收起过往记录' : ('查看过往 '+rest.length+' 条记录');
    }
    var open = feed.classList.contains('history-open');
    rest.forEach(function(card){
      card.style.display = open ? '' : 'none';
      if(!card.dataset.dateLabel){
        var txt = card.textContent.trim();
        var m = txt.match(/\d{1,2}\/\d{1,2}/);
        card.dataset.dateLabel = m ? m[0] : txt.slice(0,8);
      }
      card.setAttribute('data-collapsed-label', card.dataset.dateLabel);
      if(!card.dataset.expanded){
        card.classList.add('history-collapsed');
      }
      if(!card.dataset.bound){
        card.dataset.bound = '1';
        card.addEventListener('click', function(e){
          if(this.classList.contains('history-collapsed')){
            this.classList.remove('history-collapsed');
            this.dataset.expanded = '1';
          } else {
            this.classList.add('history-collapsed');
            this.dataset.expanded = '';
          }
          e.stopPropagation();
        });
      }
    });
    refreshToggleText();
    historyBusy = false;
  }
  function init(){
    var searchInput = document.getElementById('smart-search-input');
    if(!searchInput) return;
    var section = searchInput.closest('section');
    var createBox = document.querySelector('.border-dashed');
    var feed = document.getElementById('flow-feed');
    if(!section || !feed) return;
    addStyle();
    hideSidebars();
    var player = buildPlayer();
    section.insertBefore(player, section.firstChild);
    section.insertBefore(feed, player.nextSibling);
    if(createBox) createBox.style.display = 'none';
    var searchWrap = searchInput.closest('.relative');
    if(searchWrap) section.appendChild(searchWrap);
    var searchHeader = document.getElementById('search-header');
    if(searchHeader) section.appendChild(searchHeader);
    setupHistory(feed);
    new MutationObserver(function(){ setupHistory(feed); }).observe(feed, {childList:true});
    var DATA = null, chapterIndex = 0, playing = false, rate = 1, voice = null;
    var audioEl = new Audio();
    audioEl.preload = 'auto';
    function pickVoice(){
      var voices = speechSynthesis.getVoices();
      voice = voices.find(function(v){return v.lang==='zh-CN';}) || voices.find(function(v){return v.lang && v.lang.indexOf('zh')===0;}) || null;
    }
    speechSynthesis.onvoiceschanged = pickVoice; pickVoice();
    function splitRef(content){
      var m = content.match(/^([^\s]{4,20}[：:][^\s]{1,15})\s+([\s\S]*)$/);
      if(m) return {ref: m[1], body: m[2]};
      return {ref: '', body: content};
    }
    function pad(n){ return n<10 ? '0'+n : ''+n; }
    async function loadToday(){
      var res = await _db.from('scripture').select('id,title,content,created_at').order('created_at',{ascending:false}).limit(1);
      var s = res.data && res.data[0];
      if(!s){ document.getElementById('lp-status').textContent = '还没有今天的经文'; return; }
      var cres = await _db.from('creations').select('creation_type,content').eq('scripture_id', s.id);
      var byType = {};
      (cres.data||[]).forEach(function(c){ byType[c.creation_type]=c.content; });
      var d = new Date(s.created_at);
      var parsed = splitRef(s.content);
      DATA = {
        date: d.getFullYear()+'年'+(d.getMonth()+1)+'月'+d.getDate()+'日',
        dateKey: d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()),
        title: s.title,
        ref: parsed.ref,
        chapters: [
          {label:'经文原文', text: s.content, idx:0},
          {label:'背景介绍', text: byType.background || '', idx:1},
          {label:'经文解读', text: byType.interpretation || '', idx:2},
          {label:'生命实践与祷告', text: byType.practice || '', idx:3}
          ].filter(function(c){return c.text;})
      };
      document.getElementById('lp-date').textContent = DATA.date;
      document.getElementById('lp-title').textContent = DATA.title;
      document.getElementById('lp-ref').textContent = DATA.ref;
      renderChapters();
      document.getElementById('lp-status').textContent = '点击播放，收听今天的经文';
    }
    function renderChapters(){
      var wrap = document.getElementById('lp-chapters');
      wrap.innerHTML = '';
      DATA.chapters.forEach(function(c,i){
        var b = document.createElement('button');
        b.className = i===chapterIndex ? 'active' : (i<chapterIndex ? 'done' : '');
        b.onclick = function(){ stop(); chapterIndex=i; renderChapters(); play(); };
        wrap.appendChild(b);
      });
      document.getElementById('lp-chapter-label').textContent = DATA.chapters[chapterIndex].label;
    }
    function audioUrlFor(chapter){
      return 'audio/' + DATA.dateKey + '-' + chapter.idx + '.mp3';
    }
    function speakFallback(chapter){
      var utter = new SpeechSynthesisUtterance(chapter.text);
      utter.lang = 'zh-CN'; utter.rate = rate;
      if(voice) utter.voice = voice;
      utter.onend = advance;
      speechSynthesis.speak(utter);
      playing = true; updateIcon();
      document.getElementById('lp-status').textContent = '正在播放（系统朗读）：'+chapter.label;
    }
    function advance(){
      if(DATA && chapterIndex < DATA.chapters.length-1){ chapterIndex++; renderChapters(); play(); }
      else { playing=false; updateIcon(); document.getElementById('lp-status').textContent='播放完了'; }
    }
    function play(){
      if(!DATA) return;
      var chapter = DATA.chapters[chapterIndex];
      audioEl.pause();
      audioEl.onended = null;
      audioEl.onerror = null;
      audioEl.src = audioUrlFor(chapter);
      audioEl.playbackRate = rate;
      audioEl.onended = advance;
      audioEl.onerror = function(){ speakFallback(chapter); };
      var p = audioEl.play();
      if(p && p.catch){ p.catch(function(){ speakFallback(chapter); }); }
      playing = true; updateIcon();
      document.getElementById('lp-status').textContent = '正在播放：'+chapter.label;
    }
    function stop(){
      audioEl.pause();
      speechSynthesis.cancel();
      playing=false; updateIcon();
    }
    function updateIcon(){
      document.getElementById('lp-play-icon').innerHTML = playing ? '<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>' : '<path d="M8 5v14l11-7z"/>';
    }
    document.getElementById('lp-play').onclick = function(){ if(playing){ stop(); document.getElementById('lp-status').textContent='已暂停'; } else { play(); } };
    document.getElementById('lp-prev').onclick = function(){ stop(); chapterIndex=Math.max(0,chapterIndex-1); renderChapters(); play(); };
    document.getElementById('lp-next').onclick = function(){ stop(); if(DATA && chapterIndex<DATA.chapters.length-1){ chapterIndex++; renderChapters(); play(); } };
    document.querySelectorAll('#lp-speed button').forEach(function(btn){
      btn.onclick = function(){
        document.querySelectorAll('#lp-speed button').forEach(function(b){b.classList.remove('active');});
        btn.classList.add('active'); rate = parseFloat(btn.dataset.speed);
        audioEl.playbackRate = rate;
        if(playing){ stop(); play(); }
      };
    });
    loadToday();
  }
  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', init); }
  else { init(); }
})();
