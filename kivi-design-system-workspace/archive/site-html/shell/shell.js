/*
  网站外壳：顶栏、左侧目录、本页目录、演示的代码面板、复制、属性面板、变量表。
  只管网站本身，不属于组件库，前端不用抄。
  不用任何框架，双击 html 也能打开。
*/
(function () {
  var FIGMA = 'https://www.figma.com/design/bfXarGblevAYPh7a6nmXlt/KIVI-UI-KIT-V2';

  // 左侧目录，和 Figma 的页一一对应。没 href 的是还没迁过来的页
  var NAV = [
    { group: '开始', items: [
      { id: 'home', title: '总览', href: 'index.html' }
    ] },
    { group: '基础', items: [
      { id: 'tokens', title: '变量', href: 'foundations/tokens.html' },
      { id: 'motion', title: '动效', href: 'foundations/motion.html' },
      { id: 'icons', title: '图标', href: 'foundations/icons.html' },
      { title: '占位图' }
    ] },
    { group: '通用组件', items: [
      { id: 'button', title: '按钮', href: 'components/button.html' },
      { id: 'menus-tooltip', title: '菜单和提示', href: 'components/menus-tooltip.html' },
      { id: 'selection', title: '选择控件', href: 'components/selection.html' },
      { id: 'inputs', title: '输入控件', href: 'components/inputs.html' },
      { id: 'dialog', title: '弹窗', href: 'components/dialog.html' },
      { id: 'feedback', title: '反馈', href: 'components/feedback.html' },
      { id: 'tabs-tags-avatar', title: '选项卡、标签和头像', href: 'components/tabs-tags-avatar.html' }
    ] },
    { group: '业务组件', items: [
      { id: 'canvas', title: '画布', href: 'business/canvas.html' },
      { id: 'agent', title: 'Agent', href: 'business/agent.html' },
      { id: 'main-site', title: '主站', href: 'business/main-site.html' }
    ] }
  ];

  var body = document.body;
  var root = body.getAttribute('data-root') || '';
  var current = body.getAttribute('data-page');

  // ---------- 小工具 ----------

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // 去掉公共缩进和首尾空行
  function dedent(src) {
    var lines = src.replace(/\t/g, '  ').split('\n');
    while (lines.length && !lines[0].trim()) lines.shift();
    while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
    var min = Infinity;
    lines.forEach(function (l) {
      if (l.trim()) min = Math.min(min, l.match(/^ */)[0].length);
    });
    return lines.map(function (l) { return l.slice(min); }).join('\n');
  }

  // 浏览器把 disabled 序列化成 disabled=""，改回来
  function tidy(html) {
    return html.replace(/ (disabled|hidden|checked)=""/g, ' $1');
  }

  // ---------- 代码高亮 ----------

  function hlTag(tag) {
    var m = tag.match(/^<(\/?)([a-zA-Z0-9-]+)([\s\S]*?)(\/?)>$/);
    if (!m) return esc(tag);
    var attrs = m[3].replace(/([^\s=]+)(?:=("[^"]*"|'[^']*'|[^\s"'>]+))?/g, function (_, name, val) {
      return '<span class="t-attr">' + esc(name) + '</span>' + (val ? '=<span class="t-str">' + esc(val) + '</span>' : '');
    });
    return '<span class="t-punc">&lt;' + m[1] + '</span><span class="t-tag">' + m[2] + '</span>' + attrs + '<span class="t-punc">' + m[4] + '&gt;</span>';
  }

  function hlHtml(src) {
    var out = '', last = 0, m, re = /<!--[\s\S]*?-->|<\/?[a-zA-Z][^>]*>/g;
    while ((m = re.exec(src))) {
      out += esc(src.slice(last, m.index));
      out += m[0].indexOf('<!--') === 0 ? '<span class="t-com">' + esc(m[0]) + '</span>' : hlTag(m[0]);
      last = re.lastIndex;
    }
    return out + esc(src.slice(last));
  }

  function hlCss(src) {
    return src.split(/(\/\*[\s\S]*?\*\/)/).map(function (part, i) {
      if (i % 2) return '<span class="t-com">' + esc(part) + '</span>';
      return esc(part)
        .replace(/^([^\n{}]+)(\{)/gm, '<span class="t-tag">$1</span>$2')
        .replace(/(--[\w-]+)(\s*:)/g, '<span class="t-attr">$1</span>$2');
    }).join('');
  }

  // ---------- 复制 ----------

  function copyText(text, done) {
    function fallback() {
      var ta = el('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
      body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (e) { /* 复制失败就算了 */ }
      body.removeChild(ta);
      done && done();
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { done && done(); }, fallback);
    } else {
      fallback();
    }
  }

  // 复制按钮本身就用 KIVI 的弱按钮
  function copyButton(getText, label) {
    label = label || '复制';
    var btn = el('button', 'kv-button kv-button--sm kv-button--weak shell-copy');
    btn.type = 'button';
    function idle() { btn.innerHTML = '<i class="kv-icon" data-icon="Copy"></i><span>' + label + '</span>'; KiviIcons.render(btn); }
    idle();
    btn.addEventListener('click', function () {
      copyText(getText(), function () {
        btn.innerHTML = '<i class="kv-icon" data-icon="CheckSmall"></i><span>已复制</span>';
        KiviIcons.render(btn);
        clearTimeout(btn._t);
        btn._t = setTimeout(idle, 1200);
      });
    });
    return btn;
  }

  function codeBlock(code, lang) {
    var wrap = el('div', 'shell-code');
    var pre = el('pre');
    var c = el('code');
    pre.appendChild(c);
    wrap.appendChild(pre);
    wrap.appendChild(copyButton(function () { return wrap._code; }));
    setCode(wrap, code, lang);
    return wrap;
  }

  function setCode(wrap, code, lang) {
    wrap._code = code;
    wrap.querySelector('code').innerHTML = lang === 'css' ? hlCss(code) : hlHtml(code);
  }

  // ---------- 顶栏、目录 ----------

  function buildChrome() {
    var main = document.querySelector('main');
    var top = el('header', 'shell-top');
    top.innerHTML =
      '<button class="kv-icon-button kv-icon-button--32 kv-icon-button--text shell-menu" type="button" aria-label="目录"><i class="kv-icon" data-icon="More"></i></button>' +
      '<a class="shell-logo" href="' + root + 'index.html"><span class="shell-logo-mark"></span>KIVI 设计规范</a>' +
      '<span class="shell-badge">草稿 0.1</span>' +
      '<span class="shell-spacer"></span>' +
      '<a class="kv-button kv-button--sm kv-button--text" href="' + FIGMA + '" target="_blank" rel="noopener"><span>Figma 组件库</span></a>';

    var nav = el('nav', 'shell-nav');
    NAV.forEach(function (g) {
      nav.appendChild(el('div', 'shell-nav-group', esc(g.group)));
      g.items.forEach(function (it) {
        if (!it.href) {
          nav.appendChild(el('span', 'shell-nav-item is-todo', esc(it.title) + '<em>待迁移</em>'));
          return;
        }
        var a = el('a', 'shell-nav-item' + (it.id === current ? ' is-current' : ''), esc(it.title));
        a.href = root + it.href;
        nav.appendChild(a);
      });
    });

    var toc = el('aside', 'shell-toc');
    var heads = main.querySelectorAll('h2[id]');
    if (heads.length > 1) {
      toc.appendChild(el('div', 'shell-toc-title', '本页'));
      heads.forEach(function (h) {
        var a = el('a', null, esc(h.textContent));
        a.href = '#' + h.id;
        toc.appendChild(a);
      });
      if ('IntersectionObserver' in window) {
        var links = toc.querySelectorAll('a');
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (!e.isIntersecting) return;
            links.forEach(function (a) { a.classList.toggle('is-current', a.getAttribute('href') === '#' + e.target.id); });
          });
        }, { rootMargin: '-64px 0px -70% 0px' });
        heads.forEach(function (h) { io.observe(h); });
      }
    }

    var frame = el('div', 'shell-frame');
    main.parentNode.insertBefore(top, main);
    main.parentNode.insertBefore(frame, main);
    frame.appendChild(nav);
    frame.appendChild(main);
    frame.appendChild(toc);

    top.querySelector('.shell-menu').addEventListener('click', function () {
      body.classList.toggle('nav-open');
    });
  }

  // ---------- 演示：预览 + 代码 ----------

  // <div data-demo> 里写的 HTML 就是代码，显示和复制的都是它
  function initDemos() {
    document.querySelectorAll('[data-demo]').forEach(function (preview) {
      var code = tidy(dedent(preview.innerHTML));
      var fig = el('figure', 'shell-demo');
      preview.parentNode.insertBefore(fig, preview);
      fig.appendChild(preview);
      preview.classList.add('shell-demo-preview');
      if (preview.getAttribute('data-demo') === 'nocode') return;

      var block = codeBlock(code, 'html');
      block.hidden = true;
      var bar = el('div', 'shell-demo-bar');
      var toggle = el('button', 'kv-button kv-button--sm kv-button--weak', '<span>显示代码</span>');
      toggle.type = 'button';
      toggle.addEventListener('click', function () {
        block.hidden = !block.hidden;
        toggle.firstChild.textContent = block.hidden ? '显示代码' : '收起代码';
      });
      bar.appendChild(toggle);
      bar.appendChild(copyButton(function () { return code; }, '复制代码'));
      fig.appendChild(bar);
      fig.appendChild(block);
    });
  }

  // <pre data-code="css"> 或 <script type="text/plain" data-code="html"> 换成带复制的代码块
  function initCode() {
    document.querySelectorAll('[data-code]').forEach(function (src) {
      var block = codeBlock(dedent(src.textContent), src.getAttribute('data-code'));
      src.parentNode.replaceChild(block, src);
    });
  }

  // ---------- 属性面板：像 Figma 右侧的属性 ----------

  /*
    cfg.controls  [{ key, label, type: 'segment' | 'toggle' | 'text', options: [[值, 名字]], value }]
    cfg.render    state → 这一刻的 HTML（预览和代码都用它）
    cfg.rules     state → { key: [不可选的值] }，可选
    cfg.media     state → 是否换成图片底，可选
  */
  function playground(host, cfg) {
    var state = {};
    cfg.controls.forEach(function (c) { state[c.key] = c.value; });

    host.classList.add('shell-pg');
    var stage = el('div', 'shell-pg-stage');
    var panel = el('div', 'shell-pg-panel');
    var code = codeBlock('', 'html');
    host.appendChild(stage);
    host.appendChild(panel);
    host.appendChild(code);

    var inputs = {};
    cfg.controls.forEach(function (c) {
      var row = el('div', 'shell-pg-row');
      row.appendChild(el('div', 'shell-pg-label', esc(c.label)));
      if (c.type === 'segment') {
        var seg = el('div', 'shell-seg');
        c.options.forEach(function (o) {
          var b = el('button', null, esc(o[1]));
          b.type = 'button';
          b.setAttribute('data-value', o[0]);
          b.addEventListener('click', function () { state[c.key] = o[0]; update(); });
          seg.appendChild(b);
        });
        row.appendChild(seg);
        inputs[c.key] = seg;
      } else if (c.type === 'toggle') {
        var sw = el('button', 'shell-switch');
        sw.type = 'button';
        sw.setAttribute('role', 'switch');
        sw.addEventListener('click', function () { state[c.key] = !state[c.key]; update(); });
        row.appendChild(sw);
        inputs[c.key] = sw;
      } else {
        var input = el('input', 'shell-input');
        input.value = c.value;
        input.addEventListener('input', function () { state[c.key] = input.value; update(); });
        row.appendChild(input);
        inputs[c.key] = input;
      }
      panel.appendChild(row);
    });

    function update() {
      var rules = cfg.rules ? cfg.rules(state) : {};
      cfg.controls.forEach(function (c) {
        if (c.type === 'segment') {
          var off = rules[c.key] || [];
          if (off.indexOf(state[c.key]) >= 0) {
            var ok = c.options.filter(function (o) { return off.indexOf(o[0]) < 0; })[0];
            if (ok) state[c.key] = ok[0];
          }
          inputs[c.key].querySelectorAll('button').forEach(function (b) {
            var v = b.getAttribute('data-value');
            b.setAttribute('aria-pressed', String(v === state[c.key]));
            b.disabled = off.indexOf(v) >= 0;
          });
        } else if (c.type === 'toggle') {
          var off2 = rules[c.key];
          if (off2) state[c.key] = false;
          inputs[c.key].setAttribute('aria-checked', String(!!state[c.key]));
          inputs[c.key].disabled = !!off2;
        }
      });
      var html = cfg.render(state);
      stage.innerHTML = html;
      stage.classList.toggle('is-media', !!(cfg.media && cfg.media(state)));
      KiviIcons.render(stage);
      // is-hover、is-active、is-focus 只是文档里摆静态状态用，代码里去掉
      setCode(code, html.replace(/ is-(hover|active|focus)\b/g, ''), 'html');
    }

    update();
  }

  // ---------- 变量表：值从 tokens.css 读，页面上不写死 ----------

  function tokenPreview(kind, name) {
    var v = 'var(' + name + ')';
    switch (kind) {
      case 'color': return '<span class="tk-swatch" style="background:' + v + '"></span>';
      case 'space': return '<span class="tk-bar" style="width:' + v + '"></span>';
      case 'radius': return '<span class="tk-radius" style="border-radius:' + v + '"></span>';
      case 'stroke': return '<span class="tk-stroke" style="height:' + v + '"></span>';
      case 'opacity': return '<span class="tk-opacity" style="opacity:' + v + '"></span>';
      case 'font-size': return '<span class="tk-text" style="font-size:' + v + '">字</span>';
      case 'line-height': return '<span class="tk-lh" style="height:' + v + '"></span>';
      case 'weight': return '<span class="tk-text" style="font-weight:' + v + '">字</span>';
      default: return '';
    }
  }

  function initTokens() {
    var cs = getComputedStyle(document.documentElement);
    document.querySelectorAll('tr[data-token]').forEach(function (tr) {
      var name = tr.getAttribute('data-token');
      var kind = tr.closest('[data-kind]').getAttribute('data-kind');
      var value = cs.getPropertyValue(name).trim();
      var cells = tr.children;
      var pv = el('td', 'tk-preview', tokenPreview(kind, name));
      var chip = el('button', 'tk-chip', esc(name));
      chip.type = 'button';
      chip.title = '复制 var(' + name + ')';
      chip.addEventListener('click', function () {
        copyText('var(' + name + ')', function () {
          chip.classList.add('is-copied');
          setTimeout(function () { chip.classList.remove('is-copied'); }, 1000);
        });
      });
      var varTd = el('td');
      varTd.appendChild(chip);
      tr.insertBefore(pv, cells[0]);
      tr.insertBefore(varTd, cells[2]);
      tr.insertBefore(el('td', 'tk-value', esc(value)), cells[3]);
    });

    // 复制全部：按表分组拼成 :root { … }
    document.querySelectorAll('[data-copy-tokens]').forEach(function (slot) {
      slot.appendChild(copyButton(function () {
        var out = [':root {'];
        document.querySelectorAll('table[data-kind]').forEach(function (t) {
          var rows = t.querySelectorAll('tr[data-token]');
          if (!rows.length) return;
          out.push('  /* ' + t.getAttribute('data-group') + ' */');
          rows.forEach(function (tr) {
            var n = tr.getAttribute('data-token');
            out.push('  ' + n + ': ' + cs.getPropertyValue(n).trim() + ';');
          });
        });
        out.push('}');
        return out.join('\n');
      }, '复制全部变量'));
    });
  }

  // ---------- 启动 ----------

  // 图片底：浮层类型要放在图片上看
  document.documentElement.style.setProperty('--shell-media', 'url("' + root + '../assets/placeholders/kiwi-light-16x9.webp")');

  buildChrome();
  initDemos();
  initCode();
  initTokens();
  KiviIcons.render(document);

  window.KiviShell = {
    playground: playground,
    codeBlock: codeBlock,
    copyText: copyText,
    hlCss: hlCss
  };
})();
