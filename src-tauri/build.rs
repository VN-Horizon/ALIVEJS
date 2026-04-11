use std::env;
use std::fs;
use std::path::Path;

fn main() {
    if env::var("TARGET")
        .unwrap_or_default()
        .contains("android")
    {
        sync_android_icons();
    }
    tauri_build::build()
}

/// Copy `icons/android` (from `tauri icon`) into the generated Android `res` tree so the app uses your launcher assets.
fn sync_android_icons() {
    let manifest_dir = Path::new(env!("CARGO_MANIFEST_DIR"));
    let src = manifest_dir.join("icons/android");
    let dest = manifest_dir.join("gen/android/app/src/main/res");
    if !src.is_dir() || !dest.is_dir() {
        return;
    }
    let Ok(entries) = fs::read_dir(&src) else {
        return;
    };
    for entry in entries.flatten() {
        let from = entry.path();
        if !from.is_dir() {
            continue;
        }
        let to = dest.join(entry.file_name());
        if let Err(e) = copy_dir_merge(&from, &to) {
            println!(
                "cargo:warning=sync_android_icons: failed to copy {:?} -> {:?}: {}",
                from, to, e
            );
        }
    }
}

fn copy_dir_merge(src: &Path, dst: &Path) -> std::io::Result<()> {
    fs::create_dir_all(dst)?;
    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let from = entry.path();
        let to = dst.join(entry.file_name());
        if from.is_dir() {
            copy_dir_merge(&from, &to)?;
        } else {
            fs::copy(&from, &to)?;
        }
    }
    Ok(())
}
