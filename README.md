````markdown
# Git操作まとめ：1〜20

このREADMEでは、Ubuntu上でGitプロジェクトを作成し、ブランチで作業して、`main` に統合し、GitHubへpushするまでの流れをまとめる。

---

## 1. プロジェクトフォルダへ移動

```bash
cd ~/projects/slack
```

### 解説

`cd` はフォルダを移動するコマンド。

```text
cd = change directory
```

`~/projects/slack` は以下の場所を意味する。

```text
/home/kamekame/projects/slack
```

つまり、このコマンドは `/home/kamekame/projects/slack` に移動する作業である。

---

## 2. Git管理を開始

```bash
git init
```

### 解説

現在のフォルダをGitで管理し始めるコマンド。

実行すると、フォルダ内に `.git` という隠しフォルダが作られる。

```text
/home/kamekame/projects/slack/.git/
```

この `.git` フォルダの中に、Gitの履歴、ブランチ情報、設定情報などが保存される。

---

## 3. Gitの状態を確認

```bash
git status
```

### 解説

現在のGitの状態を確認するコマンド。

確認できる内容は以下。

```text
今どのブランチにいるか
変更されたファイルがあるか
git add されているファイルがあるか
commitしていない変更があるか
```

きれいな状態の例。

```text
On branch main
nothing to commit, working tree clean
```

意味は以下。

```text
現在のブランチは main
commitする変更はない
作業フォルダはきれいな状態
```

---

## 4. README.mdを作成

```bash
echo "# slack" > README.md
```

### 解説

`README.md` というファイルを作り、その中に `# slack` と書き込むコマンド。

分解すると以下の意味になる。

```text
echo "# slack"   → "# slack" という文字を出力する
> README.md     → その出力を README.md に書き込む
```

作成されるファイル。

```text
README.md
```

中身。

```markdown
# slack
```

`README.md` は、プロジェクトの説明を書くためのファイルである。

---

## 5. ファイルをcommit対象に登録

```bash
git add README.md
または
git add .
```


### 解説

`README.md` を次のcommitに含める準備をするコマンド。
git add . は変更したファイルすべてを登録する
Gitでは、基本的に以下の流れで履歴を保存する。

```text
ファイルを作る・編集する
↓
git add で登録する
↓
git commit で履歴として保存する
```

`git add` されたファイルは、ステージングエリアに入る。

---

## 6. 最初のcommitを作成

```bash
git commit -m "Initial commit"
```

### 解説

`git add` した内容をGitの履歴として保存するコマンド。

`-m` はcommitメッセージを指定するオプション。変更点とかのメモをできる

`Initial commit` は「最初のcommit」という意味である。

---

## 7. ブランチ名をmainに変更

```bash
git branch -M main
```

### 解説

現在のブランチ名を `main` に変更するコマンド。

古いGitでは、最初のブランチ名が `master` になることがある。  
最近の共同開発では、`main` を使うことが多い。

```text
master → main
```

`-M` は、強制的にブランチ名を変更するオプション。

---

## 8. ブランチ一覧を確認

```bash
git branch
```

### 解説

ローカルにあるブランチ一覧を表示するコマンド。

表示例。

```text
* main
```

`*` がついているブランチが、現在いるブランチである。

例えば以下の表示なら、

```text
  feature/add-test-file
* main
```

現在は `main` ブランチにいる。

---

## 9. 作業用ブランチを作成して移動

```bash
git checkout -b feature/add-test-file
```

### 解説

新しいブランチを作って、そのブランチに移動するコマンド。

分解すると以下の意味になる。

```text
git checkout              → ブランチを切り替える
-b                        → 新しいブランチを作る
feature/add-test-file     → 作るブランチ名
```

つまり以下の作業を同時に行っている。

```text
feature/add-test-file というブランチを作成する
↓
そのブランチに移動する
```

作業用ブランチを使うことで、`main` を直接変更せずに安全に作業できる。

---

## 10. 作業用ブランチでファイルを作成

```bash
echo "Hello from feature branch" > hello.txt
```

### 解説

`hello.txt` というファイルを作り、その中に文字を書き込むコマンド。

作成されるファイル。

```text
hello.txt
```

中身。

```text
Hello from feature branch
```

この作業は `feature/add-test-file` ブランチ上で行う。

---

## 11. ファイルを確認

```bash
ls
```

### 解説

今いるフォルダの中身を表示するコマンド。

表示例。

```text
README.md  hello.txt
```

---

```bash
cat hello.txt
```

### 解説

`hello.txt` の中身をターミナルに表示するコマンド。

表示例。

```text
Hello from feature branch
```

---

## 12. hello.txtをcommit対象に登録

```bash
git add hello.txt
```

### 解説

`hello.txt` を次のcommitに含める準備をするコマンド。

この時点では、まだGitの履歴には保存されていない。  
履歴として保存するには、次の `git commit` が必要である。

---

## 13. 作業用ブランチでcommit

```bash
git commit -m "Add hello file"
```

### 解説

`hello.txt` の追加をGitの履歴として保存するコマンド。

commitメッセージは以下。

```text
Add hello file
```

意味は以下。

```text
helloファイルを追加した
```

このcommitは、まず `feature/add-test-file` ブランチ上に保存される。

---

## 14. mainブランチに戻る

```bash
git checkout main
```

### 解説

現在のブランチを `main` に切り替えるコマンド。

この時点で `hello.txt` が一時的に見えなくなる場合がある。  
それは正常である。

理由は以下。

```text
hello.txt は feature/add-test-file ブランチには存在する
しかし、まだ main ブランチには統合されていない
```

---

## 15. 作業用ブランチをmainへ統合

```bash
git merge feature/add-test-file
```

### 解説

`feature/add-test-file` ブランチで行った変更を、現在いる `main` ブランチに取り込むコマンド。

つまり以下の作業である。

```text
feature/add-test-file の変更
↓
main に統合
```

このmergeによって、`main` ブランチにも `hello.txt` が追加される。

---

## 16. Gitの履歴を確認

```bash
git log --oneline --graph --all
```

### 解説

Gitのcommit履歴を見やすく表示するコマンド。

各オプションの意味は以下。

```text
git log       → commit履歴を見る
--oneline     → 1commitを1行で表示する
--graph       → ブランチの流れを線で表示する
--all         → すべてのブランチを表示する
```

表示例。

```text
* 1234567 Add hello file
* abcdef0 Initial commit
```

意味は以下。

```text
Initial commit のあとに
Add hello file というcommitがある
```

---

## 17. GitHubの保存先を登録

```bash
git remote add origin https://github.com/ユーザー名/slack.git
```

### 解説

ローカルのGitリポジトリと、GitHub上のリポジトリをつなぐコマンド。

分解すると以下の意味になる。

```text
git remote add     → 外部リポジトリを追加する
origin             → 外部リポジトリの名前
URL                → GitHubのリポジトリURL
```

`origin` は、GitHub上の保存先につける一般的な名前である。

つまりこのコマンドは以下の意味。

```text
このローカルリポジトリのアップロード先をGitHubに設定する
```

---

## 18. remoteの登録内容を確認

```bash
git remote -v
```

### 解説

登録されている外部リポジトリを確認するコマンド。

表示例。

```text
origin  https://github.com/ユーザー名/slack.git (fetch)
origin  https://github.com/ユーザー名/slack.git (push)
```

意味は以下。

```text
fetch → GitHubから取得するときのURL
push  → GitHubへ送信するときのURL
```

---

## 19. GitHubへpush

```bash
git push -u origin main
```

### 解説

ローカルの `main` ブランチをGitHubへアップロードするコマンド。

分解すると以下の意味になる。

```text
git push  → GitHubなどの外部リポジトリへ送る
-u        → 今後のpush先を記憶する
origin    → GitHubの保存先名
main      → pushするブランチ名
```

つまり以下の作業である。

```text
ローカルのmainブランチをGitHubのoriginへアップロードする
```

`-u` を付けておくと、次回からは以下だけでpushできる。

```bash
git push
```

---

## 20. もしremoteがすでにある場合

```bash
git remote set-url origin https://github.com/ユーザー名/slack.git
```

### 解説

すでに登録されている `origin` のURLを変更するコマンド。

`git remote add origin ...` を実行したときに、以下のように出た場合に使う。

```text
remote origin already exists
```

意味は以下。

```text
originの接続先URLを新しいGitHub URLに変更する
```

その後、再度pushする。

```bash
git push -u origin main
```

---

# コマンド完全版

以下は、1〜20の流れをまとめた実行用コマンドである。

```bash
cd ~/projects/slack

git init

git status

echo "# slack" > README.md
git add README.md
git commit -m "Initial commit"

git branch -M main

git branch

git checkout -b feature/add-test-file

echo "Hello from feature branch" > hello.txt

ls
cat hello.txt

git add hello.txt
git commit -m "Add hello file"

git checkout main
git merge feature/add-test-file

git log --oneline --graph --all

git remote add origin https://github.com/ユーザー名/slack.git
git remote -v

git push -u origin main
```

---

# すでにremoteがある場合のpush

```bash
git remote set-url origin https://github.com/ユーザー名/slack.git
git remote -v
git push -u origin main
```

---

# 今後の基本操作

ファイルを変更したら、基本は以下の流れで作業する。

```bash
git status
git add .
git commit -m "変更内容を書く"
git push
```

---

# 複数人開発での基本操作

作業を始める前に、まず最新版を取得する。

```bash
git pull
```

作業用ブランチを作成する。

```bash
git checkout -b feature/作業名
```

作業が終わったら、変更を保存してGitHubへ送る。

```bash
git add .
git commit -m "作業内容"
git push -u origin feature/作業名
```

その後、GitHub上でPull Requestを作成し、レビュー後に `main` へ統合する。

---

# Gitの基本イメージ

```text
main
│
│  Initial commit
│
├── feature/add-test-file
│      Add hello file
│
└── main に merge
       hello.txt が統合される
```

---

# 重要ポイント

## mainを直接いじらない

複数人開発では、基本的に `main` を直接編集しない。

```text
main
↓
feature/作業名 を作る
↓
作業する
↓
commitする
↓
Pull Requestを作る
↓
mainにmergeする
```

---

## commitは作業の区切りごとに行う

良いcommit例。

```bash
git commit -m "Add README"
git commit -m "Add login page"
git commit -m "Fix typo in README"
```

悪いcommit例。

```bash
git commit -m "いろいろ変更"
git commit -m "修正"
git commit -m "aaaa"
```

---

## push前に確認する

```bash
git status
git log --oneline --graph --all
```

これで、今の状態と履歴を確認してからGitHubへpushする。

---

# 最小限覚えるコマンド

```bash
git status
git add .
git commit -m "message"
git push
git pull
git checkout -b feature/name
git checkout main
git merge feature/name
```
````
