const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../assets/gitbook/gitbook-plugin-fontsettings/fontsettings.js'), 'utf8');
const metadata = fs.readFileSync(path.join(__dirname, '../_includes/metadata.json.tpl'), 'utf8');
const config = JSON.parse(metadata.match(/"fontsettings":\s*(\{[^}]+\})/)[1]);

function createSettings({ dark = false, saved } = {}) {
    const book = { className: 'book with-summary' };
    const header = { className: 'book-header' };
    const listeners = [];
    const writes = [];
    const events = new Map();
    let toolbar;
    let stored = saved && structuredClone(saved);
    const media = {
        matches: dark,
        addEventListener(type, listener) {
            assert.equal(type, 'change');
            listeners.push(listener);
        }
    };

    function wrap(nodes) {
        const result = {
            length: nodes.length,
            addClass(value) {
                nodes.forEach(node => node.className += ' ' + value);
                return result;
            },
            removeClass(value) {
                nodes.forEach(node => node.className = node.className.split(/\s+/).filter(name => name !== value).join(' '));
                return result;
            }
        };
        nodes.forEach((node, index) => result[index] = node);
        return result;
    }

    function $(selector) {
        return wrap(selector === '.book-body > .book-header' ? [header] : []);
    }
    $.grep = (items, predicate) => items.filter(predicate);
    $.map = (items, map) => items.map(map);
    const gitbook = {
        state: { $book: wrap([book]) },
        storage: {
            get: (key, fallback) => structuredClone(stored ?? fallback),
            set(key, value) {
                stored = structuredClone(value);
                writes.push(stored);
            }
        },
        toolbar: {
            createButton(value) { toolbar = value; return 'font-settings'; },
            removeButton() {}
        },
        events: { bind: (name, handler) => events.set(name, handler) }
    };
    vm.runInNewContext(source, {
        require: (modules, callback) => callback(gitbook, $),
        window: { matchMedia: () => media },
        Event: class Event {}
    });
    events.get('start')(null, { fontsettings: config });

    return {
        book, header, writes, api: gitbook.fontsettings,
        get toolbar() { return toolbar; },
        setSystemDark(value) {
            media.matches = value;
            listeners.forEach(listener => listener({ matches: value }));
        }
    };
}

function assertTheme(settings, theme) {
    for (const element of [settings.book, settings.header]) {
        const themes = element.className.split(/\s+/).filter(name => name.startsWith('color-theme-'));
        assert.deepEqual(themes, ['color-theme-' + theme]);
    }
}

test('site defaults to the system theme and offers it in the theme menu', () => {
    assert.equal(config.theme, 'system');
    assert.ok(createSettings().api.getThemes().some(theme => theme.config === 'system'));
});

for (const dark of [false, true]) {
    test(`new visitors follow the ${dark ? 'dark' : 'light'} system theme`, () => {
        const settings = createSettings({ dark });
        assertTheme(settings, dark ? 2 : 0);
        assert.equal(settings.writes.length, 0);
    });
}

test('system theme follows live changes without saving a manual override', () => {
    const settings = createSettings();
    settings.setSystemDark(true);
    assertTheme(settings, 2);
    settings.setSystemDark(false);
    assertTheme(settings, 0);
    assert.equal(settings.writes.length, 0);
    assert.match(settings.book.className, /with-summary/);
});

for (const [name, theme] of [['white', 0], ['sepia', 1], ['night', 2]]) {
    test(`${name} overrides the system and survives reload`, () => {
        const settings = createSettings({ dark: true });
        settings.api.setTheme(name);
        assertTheme(settings, theme);
        settings.setSystemDark(false);
        settings.setSystemDark(true);
        assertTheme(settings, theme);
        assert.equal(settings.writes.at(-1).theme, theme);
        assertTheme(createSettings({ saved: settings.writes.at(-1), dark: false }), theme);
    });
}

test('returning to system clears manual themes and persists automatic selection', () => {
    const settings = createSettings({ saved: { theme: 1, size: 3, family: 0 } });
    settings.api.setTheme('system');
    assertTheme(settings, 0);
    settings.setSystemDark(true);
    assertTheme(settings, 2);
    settings.api.enlargeFontSize({ preventDefault() {} });
    settings.api.setFamily('sans');
    const saved = settings.writes.at(-1);
    assert.equal(saved.size, 4);
    assert.equal(saved.family, 1);
    assertTheme(createSettings({ saved, dark: false }), 0);
    assertTheme(createSettings({ saved, dark: true }), 2);
});
