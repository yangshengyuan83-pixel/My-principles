(function(){
  function addStyle(){
    var s = document.createElement('style');
    s.textContent = '#listen-player{background:#fff;border:2px solid #f1f5f9;border-radius:22px;padding:18px 20px;margin-bottom:24px;text-align:center}#listen-player .lp-date{font-size:11px;color:#94a3b8;letter-spacing:.05em;font-weight:700}#listen-player .lp-title{font-size:18px;font-weight:900;margin:4px 0 2px;line-height:1.3}#listen-player .lp-ref{font-size:12px;color:#64748b}#listen-player .lp-chapters{display:flex;gap:6px;justify-content:center;margin:12px 0 4px}#listen-player .lp-chapters button{flex:1;max-width:50px;height:4px;border-radius:2px;border:none;background:#e2e8f0;padding:0;cursor:pointer}#listen-player .lp-chapters button.active{background:#1a1a1a}#listen-player .lp-chapters button.done{background:#94a3b8}#listen-player .lp-chapter-label{font-size:11px;color:#94a3b8;margin-bottom:10px}#listen-player .lp-controls{display:flex;align-items:center;justify-content:center;gap:20px}#listen-player .lp-controls button{background:none;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#1a1a1a}#listen-player .lp-play{width:44px;height:44px;border-radius:50%;background:#1a1a1a;color:#fff}#listen-player .lp-play svg{width:20px;height:20px}#listen-player .lp-speed{display:flex;justify-content:center;gap:6px;margin-top:10px}#listen-player .lp-speed button{font-size:11px;padding:3px 10px;border-radius:20px;border:1px solid #e2e8f0;background:none;color:#64748b;cursor:pointer}#listen-player .lp-speed button.active{border-color:#1a1a1a;color:#1a1a1a;font-weight:700}#listen-player .lp-status{font-size:11px;color:#94a3b8;text-align:center;margin-top:8px;min-height:14px}.history-row{display:flex;align-items:center;gap:14px;padding:14px 6px;border-bottom:1px solid #f1f5f9;cursor:pointer}.history-row:hover{background:#fafafa}.history-row-date{font-size:11px;color:#94a3b8;font-weight:700;font-family:monospace;flex-shrink:0;width:38px}.history-row-title{font-size:14px;color:#1a1a1a;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1}.history-row-play{width:28px;height:28px;border-radius:50%;background:#f1f5f9;border:none;flex-shrink:0;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#1a1a1a;padding:0}.history-row-play:hover{background:#e2e8f0}.history-row-play svg{width:12px;height:12px;margin-left:1px}.history-row-play.loading{opacity:.4;pointer-events:none}.today-card-play{position:absolute;top:24px;right:24px;width:34px;height:34px;border-radius:50%;background:#1a1a1a;color:#fff;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;z-index:2}.today-card-play:hover{opacity:.85}.today-card-play svg{width:14px;height:14px;margin-left:1px}.today-card-play.loading{opacity:.4;pointer-events:none}';
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
  var onRowPlay = null; // set inside init once player helpers exist
  var onTodayPlay = null;
  function setupHistory(feed){
    if(historyBusy) return;
    historyBusy = true;
    var all = Array.prototype.slice.call(feed.children).filter(function(el){
      return !el.classList || !el.classList.contains('history-row');
    });
    if(all.length===0){ historyBusy = false; return; }
    var todayCard = all[0];
    todayCard.style.display = '';
    if(!todayCard._playBtn){
      var cs = getComputedStyle(todayCard);
      if(cs.position === 'static') todayCard.style.position = 'relative';
      var tBtn = document.createElement('button');
      tBtn.className = 'today-card-play';
      tBtn.setAttribute('aria-label','播放今天的经文');
      tBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
      tBtn.onclick = function(e){
        e.stopPropagation();
        if(onTodayPlay) onTodayPlay(tBtn);
      };
      todayCard.appendChild(tBtn);
      todayCard._playBtn = tBtn;
    }
    var rest = all.slice(1);
    rest.forEach(function(card, i){
      card.style.display = 'none';
      if(!card._historyRow){
        var clickTarget = card.querySelector('.cursor-pointer');
        var dateSpan = card.querySelector('.mb-6 span');
        var heading = clickTarget ? clickTarget.querySelector('h1,h2,h3,h4') : null;
        var row = document.createElement('div');
        row.className = 'history-row';
        var dateEl = document.createElement('span');
        dateEl.className = 'history-row-date';
        dateEl.textContent = dateSpan ? dateSpan.textContent.trim() : '';
        var titleEl = document.createElement('span');
        titleEl.className = 'history-row-title';
        titleEl.textContent = heading ? heading.textContent.trim() : '';
        var playBtn = document.createElement('button');
        playBtn.className = 'history-row-play';
        playBtn.setAttribute('aria-label','播放这一天');
        playBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
        playBtn.onclick = function(e){
          e.stopPropagation();
          if(onRowPlay) onRowPlay(i, playBtn);
        };
        row.appendChild(dateEl);
        row.appendChild(titleEl);
        row.appendChild(playBtn);
        row.onclick = function(){ if(clickTarget) clickTarget.click(); };
        feed.insertBefore(row, card);
        card._historyRow = row;
      }
      card._historyRow.style.display = '';
    });
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
    if(searchWrap) searchWrap.style.display = 'none';
    var searchHeader = document.getElementById('search-header');
    if(searchHeader) searchHeader.style.display = 'none';
    setupHistory(feed);
    new MutationObserver(function(){ setupHistory(feed); }).observe(feed, {childList:true});
    var DATA = null, chapterIndex = 0, playing = false, rate = 1, voice = null;
    var FULL_LIST = null, LIST_INDEX = 0;
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
    // 日期一律按台湾时区（UTC+8）算，不用浏览器本地时区。
    // 音频文件名 audio/YYYY-MM-DD-N.mp3 是定时任务照推喇奴网站当天显示的日期命名的，
    // 那是台湾本地日期。按浏览器时区折算 created_at 的话两边会差一天：
    // 例如任务在澳洲凌晨 1 点（= 台湾前一天 23 点）跑，网站还是前一天、音频叫 08-15，
    // 但浏览器本地已是 08-16，就会去拿一个不存在或属于别天的 mp3。
    // 换算成 UTC+8 之后 dateKey 永远跟文件名同步，读者在哪个时区都一样。
    // 注意：taiwanDate 只能取年月日，不要拿来显示时分秒。
    function taiwanDate(iso){
      return new Date(new Date(iso).getTime() + 8*3600*1000);
    }
    function buildEntryData(s, byType){
      var d = taiwanDate(s.created_at);
      var parsed = splitRef(s.content);
      return {
        date: d.getUTCFullYear()+'年'+(d.getUTCMonth()+1)+'月'+d.getUTCDate()+'日',
        dateKey: d.getUTCFullYear()+'-'+pad(d.getUTCMonth()+1)+'-'+pad(d.getUTCDate()),
        title: s.title,
        ref: parsed.ref,
        chapters: [
          {label:'经文原文', text: s.content, idx:0},
          {label:'背景介绍', text: byType.background || '', idx:1},
          {label:'经文解读', text: byType.interpretation || '', idx:2},
          {label:'生命实践与祷告', text: byType.practice || '', idx:3}
          ].filter(function(c){return c.text;})
      };
    }
    async function ensureList(){
      if(!FULL_LIST){
        var res = await _db.from('scripture').select('id,title,content,created_at').order('created_at',{ascending:false});
        FULL_LIST = res.data || [];
      }
      return FULL_LIST;
    }
    async function activateEntry(s){
      var cres = await _db.from('creations').select('creation_type,content').eq('scripture_id', s.id);
      var byType = {};
      (cres.data||[]).forEach(function(c){ byType[c.creation_type]=c.content; });
      DATA = buildEntryData(s, byType);
      chapterIndex = 0;
      document.getElementById('lp-date').textContent = DATA.date;
      document.getElementById('lp-title').textContent = DATA.title;
      document.getElementById('lp-ref').textContent = DATA.ref;
      renderChapters();
    }
    async function loadToday(){
      var list = await ensureList();
      var s = list[0];
      if(!s){ document.getElementById('lp-status').textContent = '还没有今天的经文'; return; }
      LIST_INDEX = 0;
      await activateEntry(s);
      document.getElementById('lp-status').textContent = '点击播放，收听今天的经文';
    }
    async function playListIndex(indexInList, btn){
      if(btn) btn.classList.add('loading');
      try{
        var list = await ensureList();
        var s = list[indexInList];
        if(!s) return;
        stop();
        LIST_INDEX = indexInList;
        await activateEntry(s);
        document.getElementById('listen-player').scrollIntoView({behavior:'smooth', block:'start'});
        play();
      } finally {
        if(btn) btn.classList.remove('loading');
      }
    }
    onRowPlay = function(restIndex, btn){ playListIndex(restIndex+1, btn); };
    onTodayPlay = function(btn){ playListIndex(0, btn); };
    // 播完当天最后一段之后，自动接着播更早一天的内容，像电台一样一直往下播
    async function moveToNextDay(){
      var list = await ensureList();
      if(LIST_INDEX < list.length-1){
        LIST_INDEX++;
        await activateEntry(list[LIST_INDEX]);
        play();
      } else {
        playing=false; updateIcon();
        document.getElementById('lp-status').textContent='已经是最早的一条记录了';
      }
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
    async function advance(){
      if(DATA && chapterIndex < DATA.chapters.length-1){
        chapterIndex++; renderChapters(); play();
      } else {
        await moveToNextDay();
      }
    }
    function play(){
      if(!DATA || !DATA.chapters.length) return;
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
    document.getElementById('lp-next').onclick = async function(){
      if(DATA && chapterIndex<DATA.chapters.length-1){ stop(); chapterIndex++; renderChapters(); play(); }
      else { stop(); await moveToNextDay(); }
    };
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
