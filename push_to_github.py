"""
Script bantuan untuk push repository ke GitHub.
Penggunaan:
    python push_to_github.py <github_repo_url> [personal_access_token]

Contoh:
    python push_to_github.py https://github.com/username/siap-interview.git ghp_xxxxxxxxxxxx
"""
import sys
from dulwich import porcelain

def main():
    if len(sys.argv) < 2:
        print("=" * 60)
        print("Penggunaan: python push_to_github.py <repo_url> [personal_access_token]")
        print("Contoh:")
        print("  python push_to_github.py https://github.com/username/siapinterview.git")
        print("=" * 60)
        return

    repo_url = sys.argv[1].strip()
    token = sys.argv[2].strip() if len(sys.argv) > 2 else None

    if token and "https://" in repo_url:
        clean_url = repo_url.replace("https://", "")
        repo_url = f"https://{token}@{clean_url}"

    display_url = repo_url.split('@')[-1] if '@' in repo_url else repo_url
    print(f"Menyiapkan remote origin: {display_url}")
    
    try:
        porcelain.remote_add(".", "origin", repo_url)
    except Exception:
        # Remote origin mungkin sudah pernah ditambahkan
        pass

    print("Mengunggah (push) ke GitHub...")
    try:
        porcelain.push(".", "origin", "refs/heads/master:refs/heads/main")
        print("✅ Berhasil di-push ke branch main di GitHub!")
    except Exception as e:
        print("❌ Gagal melakukan push:", str(e))
        print("Tips: Pastikan URL repository benar dan token akses (Personal Access Token) memiliki hak akses 'repo'.")

if __name__ == "__main__":
    main()
