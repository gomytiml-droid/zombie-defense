# TASK-15b — 物理攻撃中の射撃中断（entities.js）

## 概要

物理攻撃ボタンを押した後の中断期間中、自動射撃（`fireAuto`）もスキップする。

---

## 変更対象ファイル

- `js/entities.js` のみ

---

## 変更しないもの

- 他 JS ファイル一切

---

## `fireAuto` に中断チェックを追加

**変更前の先頭部分：**
```javascript
function fireAuto(now) {
  const wp = getActiveWeapon();
  if (!wp) return;

  const rate  = Math.max(60, wp.fireRate - wp.upgRate * 80);
  const dmg   = wp.damage + wp.upgDmg * 8;
  const range = (wp.range + wp.upgRange * 20) * 1.5;

  if (now < nextFireTime) return;
```

**変更後：**
```javascript
function fireAuto(now) {
  // [TASK-15b] 物理攻撃中断中は自動射撃をスキップ
  if (typeof meleeInterruptEndTime !== 'undefined' && now < meleeInterruptEndTime) return;

  const wp = getActiveWeapon();
  if (!wp) return;

  const rate  = Math.max(60, wp.fireRate - wp.upgRate * 80);
  const dmg   = wp.damage + wp.upgDmg * 8;
  const range = (wp.range + wp.upgRange * 20) * 1.5;

  if (now < nextFireTime) return;
```

---

## チェックリスト（完了時に報告）

- [ ] `fireAuto` の先頭に `meleeInterruptEndTime` チェックを追加した
- [ ] `typeof` チェックで安全にアクセスしている（変数未定義でもエラーにならない）
- [ ] 指示にない箇所を変更していないことを確認した

---

## 注意

- 変更箇所に `// [TASK-15b]` コメントを必ず付ける
- `fireAuto` の既存ロジックは変更しない（先頭に1行追加するのみ）
