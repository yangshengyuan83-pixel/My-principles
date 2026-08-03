(function(){
  function addStyle(){
    var s = document.createElement('style');
    s.textContent = '#listen-player{background:#fff;border:2px solid #f1f5f9;border-radius:28px;padding:32px 28px;margin-bottom:32px;text-align:center}#listen-player .lp-date{font-size:12px;color:#94a3b8;letter-spacing:.05em;font-weight:700}#listen-player .lp-title{font-size:24px;font-weight:900;margin:8px 0 4px;line-height:1.35}#listen-player .lp-ref{font-size:13px;color:#64748b}#listen-player .lp-chapters{display:flex;gap:6px;justify-content:center;margin:20px 0 6px}#listen-player .lp-chapters button{flex:1;max-width:60px;height:5px;border-radius:3px;border:none;background:#e2e8f0;padding:0;cursor:pointer}#listen-player .lp-chapters button.active{background:#1a1a1a}#listen-player .lp-chapters button.done{background:#94a3b8}#listen-player .lp-chapter-label{font-size:12px;color:#94a3b8;margin-bottom:16px}#listen-player .lp-controls{display:flex;align-items:center;justify-content:center;gap:26px}#listen-player .lp-controls button{background:none;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#1a1a1a}#listen-player .lp-play{width:60px;height:60px;border-radius:50%;background:#1a1a1a;color:#fff}#listen-player .lp-speed{display:flex;justify-content:center;gap:8px;margin-top:18px}#listen-player .lp-speed button{font-size:12px;padding:5px 12px;border-radius:20px;border:1px solid #e2e8f0;background:none;color:#64748b;cursor:pointer}#listen-player .lp-speed button.active{border-color:#1a1a1a;color:#1a1a1a;font-weight:700}#listen-player .lp-status{font-size:12px;color:#94a3b8;text-align:center;margin-top:12px;min-height:16px}.history-collapsed{max-height:64px;overflow:hidden;cursor:pointer;position:relative;transition:max-height .25s ease}.history-collapsed::after{content:"点击展开";position:absolute;bottom:8px;right:24px;font-size:11px;color:#94a3b8;background:#fff;padding:2px 8px}';
    document.head.appendChild(s);
  }
  function buildPlayer(){
    var el = document.createElement('div');
    el.id = 'listen-player';
    el.innerHTML = '<div class="lp-date" id="lp-date">加载中...</div><div class="lp-title" id="lp-title"></div><div class="lp-ref" id="lp-ref"></div><div class="lp-chapters" id="lp-chapters"></div><div class="lp-chapter-label" id="lp-chapter-label"></div><div class="lp-controls"><button id="lp-prev" aria-label="上一段"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg></button><button class="lp-play" id="lp-play" aria-label="播放"><svg id="lp-play-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></button><button id="lp-next" aria-label="下一段"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M16 6h2v12h-2zM6 6v12l8.5-6z"/></svg></button></div><div class="lp-speed" id="lp-speed"><button data-speed="0.85">0.85x</button><button data-speed="1" class="active">1x</button><button data-speed="1.15">1.15x</button></div><div class="lp-status" id="lp-status">加载今天的经文中...</div>';
    return el;
  }
  function init(){
    var searchInput = document.getElementById('smart-search-input');
    if(!searchInput) return;
    var section = searchInput.closest('section');
    var createBox = document.querySelector('.border-dashed');
    var feed = document.getElementById('flow-feed');
    if(!section || !feed) return;
    addStyle();
    var player = buildPlayer();
    section.insertBefore(player, section.firstChild);
    section.insertBefore(feed, player.nextSibling);
    if(createBox) createBox.style.display = 'none';
    var searchWrap = searchInput.closest('.relative');
    if(searchWrap) section.appendChild(searchWrap);
    var searchHeader = document.getElementById('search-header');
    if(searchHeader) section.appendChild(searchHeader);
    function collapseHistory(){
      var cards = feed.children;
      for(var i=0;i<cards.length;i++){
        if(i===0){ cards[i].classList.remove('history-collapsed'); }
        else if(!cards[i].dataset.expanded){ cards[i].classList.add('history-collapsed'); }
        if(!cards[i].dataset.bound){
          cards[i].dataset.bound = '1';
          cards[i].addEventListener('click', function(e){
            if(this.classList.contains('history-collapsed')){
              this.classList.remove('history-collapsed');
              this.dataset.expanded = '1';
              e.stopPropagation();
            }
          });
        }
      }
    }
    collapseHistory();
    new MutationObserver(collapseHistory).observe(feed, {childList:true});
    var DATA = null, chapterIndex = 0, playing = false, rate = 1, voice = null;
    function pickVoice(){
      var voices = speechSynthesis.getVoices();
      voice = voices.find(function(v){return v.lang==='zh-CN';}) || voices.find(function(v){return v.lang && v.lang.indexOf('zh')===0;}) || null;
    }
    speechSynthesis.onvoiceschanged = pickVoice; pickVoice();
    async function loadToday(){
      var res = await _db.from('scripture').select('id,title,content,created_at').order('created_at',{ascending:false}).limit(1);
      var s = res.data && res.data[0];
      if(!s){ document.getElementById('lp-status').textContent = '还没有今天的经文'; return; }
      var cres = await _db.from('creations').select('creation_type,content').eq('scripture_id', s.id);
      var byType = {};
      (cres.data||[]).forEach(function(c){ byType[c.creation_type]=c.content; });
      var d = new Date(s.created_at);
      DATA = {
        date: d.getFullYear()+'年'+(d.getMonth()+1)+'月'+d.getDate()+'日',
        title: s.title,
        chapters: [
          {label:'经文原文', text: s.content},
          {label:'背景介绍', text: byType.background || ''},
          {label:'经文解读', text: byType.interpretation || ''},
          {label:'生命实践与祷告', text: byType.practice || ''}
          ].filter(function(c){return c.text;})
      };
      document.getElementById('lp-date').textContent = DATA.date;
      document.getElementById('lp-title').textContent = DATA.title;
      document.getElementById('lp-ref').textContent = '今日读经';
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
    function play(){
      if(!DATA) return;
      var chapter = DATA.chapters[chapterIndex];
      var utter = new SpeechSynthesisUtterance(chapter.text);
      utter.lang = 'zh-CN'; utter.rate = rate;
      if(voice) utter.voice = voice;
      utter.onend = function(){
        if(chapterIndex < DATA.chapters.length-1){ chapterIndex++; renderChapters(); play(); }
        else { playing=false; updateIcon(); document.getElementById('lp-status').textContent='播放完了'; }
      };
      speechSynthesis.speak(utter);
      playing = true; updateIcon();
      document.getElementById('lp-status').textContent = '正在播放：'+chapter.label;
    }
    function stop(){ speechSynthesis.cancel(); playing=false; updateIcon(); }
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
        if(playing){ stop(); play(); }
      };
    });
    loadToday();
  }
  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', init); }
  else { init(); }
})();
