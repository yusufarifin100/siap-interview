"""
Script bantuan untuk push repository ke GitHub.
Penggunaan:
    python push_to_github.py <github_repo_url> [personal_access_token]

Contoh:
    python push_to_github.py https://github.com/username/siap-interview.git ghp_xxxxxxxxxxxx
"""
import sys
import os
from dulwich import porcelain

def main():
    if len(sys.argv) < 2:
        print("Penggunaan: python push_to_github.py <repo_url> [token]")
        print("Contoh: python push_to_github.py https://github.com/username/siap-interview.git")
        return

    repo_url = sys.argv[1].strip()
    token = sys.argv[2].strip() if len(sys.argv) > 2 else None

    if token and "https://" in repo_url:
        # Sisipkan token ke URL jika disediakan
        clean_url = repo_url.replace("https://", "")
        repo_url = f"https://{token}@{clean_url}"

    print(f"Menyiapkan remote origin: {repo_url.split('@')[-1] if '@' in repo_url else repo_url}")
    repo = porcelain.open_repo_closing(".")
    with repo:
        try:
            porcelain.remote_add(repo, "origin", repo_url)
        except Exception:
            # Remote mungkin sudah ada
            pass

        print("Melakukan push branch main/master ke remote...")
        porcelain.push(repo, "origin", "refs/heads/master:refs/heads/main")
        print("✅ Berhasil di-push ke GitHub!")

if __name__ == "__main__":
    main()
