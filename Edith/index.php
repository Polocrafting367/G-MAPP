<?php
function getIcon($fullPath) {
    $ext = strtolower(pathinfo($fullPath, PATHINFO_EXTENSION));
    if (is_dir($fullPath)) return "📁";
    if ($ext === "php") return "🛠️";
    if (in_array($ext, ["html", "htm", "xhtml"])) return "🌐";
    if (in_array($ext, ["js", "mjs", "cjs"])) return "⚙️";
    if (in_array($ext, ["css", "scss", "sass", "less", "styl"])) return "🎨";
    if (in_array($ext, ["pdf"])) return "📕";
    if (in_array($ext, ["png", "jpg", "jpeg", "gif", "bmp", "webp", "tiff", "svg", "ico", "heic", "avif", "dds", "exr", "raw", "cr2", "nef"])) return "🖼️";
    if (in_array($ext, ["json", "xml", "yaml", "yml", "toml", "ini", "conf", "plist", "reg", "props"])) return "📄";
    if (in_array($ext, ["txt", "md", "log", "rtf", "csv", "tsv", "nfo", "asc", "srt", "vtt", "readme", "properties", "lst"])) return "📝";
    if (in_array($ext, ["zip", "rar", "7z", "tar", "gz", "bz2", "xz", "lz", "lzma", "zst", "iso", "dmg", "apk", "cab", "arj", "ace", "sit", "bin", "cue"])) return "🗜️";
    if (in_array($ext, ["mp3", "wav", "flac", "aac", "ogg", "m4a", "aiff", "alac", "mid", "mod", "xm", "it", "s3m"])) return "🎵";
    if (in_array($ext, ["mp4", "mkv", "avi", "mov", "wmv", "flv", "webm", "m4v", "3gp", "mpg", "mpeg", "ts", "vob"])) return "🎥";
    if (in_array($ext, ["exe", "msi", "bat", "cmd", "sh", "bin", "appimage", "deb", "rpm", "pkg", "run", "com"])) return "💻";
    if (in_array($ext, ["c", "cpp", "h", "hpp", "cc", "cxx", "cs", "java", "kt", "swift", "go", "rs", "py", "rb", "pl", "sh", "ts", "tsx", "vue", "dart", "scala", "lua", "r", "asm", "v", "sv", "m", "f90", "f95", "pas", "jl", "groovy", "clj", "cljs", "ex", "exs", "erl", "hrl", "ml", "mli"])) return "🧑‍💻";
    if (in_array($ext, ["db", "sqlite", "sqlite3", "dbf", "mdb", "accdb", "ndf", "ldf", "ibd", "frm", "myd", "myi", "sql", "dump"])) return "🗄️";
    if (in_array($ext, ["psd", "ai", "xd", "fig", "sketch", "cdr", "indd", "afdesign", "afphoto"])) return "🎨";
    if (in_array($ext, ["epub", "mobi", "azw", "azw3", "fb2", "lit", "prc", "lrf", "cbz", "cbr"])) return "📚";
    if (in_array($ext, ["crt", "cer", "pem", "key", "csr", "p12", "pfx", "jks", "der"])) return "🔐";
    if (in_array($ext, ["vhd", "vhdx", "vmdk", "img", "qcow2", "vdi", "iso", "wim", "esd"])) return "💽";
    if (in_array($ext, ["torrent"])) return "🔽";
    if (in_array($ext, ["ics", "vcs"])) return "📅";
    if (in_array($ext, ["bak", "old", "tmp", "swp", "swo", "temp", "bck"])) return "♻️";
    if (in_array($ext, ["lnk", "alias", "desktop", "url"])) return "🔗";
    if (in_array($ext, ["map", "pdb", "dmp", "core", "sym", "dbg", "ilk"])) return "🧩";
    if (in_array($ext, ["woff", "woff2", "ttf", "otf", "eot", "fon", "pfa", "pfb"])) return "🔤";
    if (in_array($ext, ["stl", "obj", "fbx", "dae", "3ds", "blend", "gltf", "glb", "ply", "step", "stp", "igs", "iges", "fcstd"])) return "🧊";
    if (in_array($ext, ["sln", "vcxproj", "csproj", "xcodeproj", "makefile", "cmake", "gradle", "pom", "build", "proj", "ninja"])) return "🛠️";
    if (in_array($ext, ["doc", "docx", "dot", "dotx", "odt", "ott", "rtf"])) return "📝";
    if (in_array($ext, ["xls", "xlsx", "xlsm", "ods", "ots", "csv", "tsv"])) return "📊";
    if (in_array($ext, ["ppt", "pptx", "pps", "odp", "otp", "key"])) return "📽️";
    if (in_array($ext, ["pub", "mspub"])) return "📰";
    if (in_array($ext, ["vsd", "vsdx", "vdx", "vss", "vst"])) return "📐";
    if (in_array($ext, ["eml", "msg", "mbox", "pst", "ost"])) return "✉️";
    if (in_array($ext, ["apk", "ipa", "appx", "xap", "cab"])) return "📱";
    return "📄";
}

$baseDir = __DIR__;
$currentPath = isset($_GET['path']) ? trim($_GET['path'], '/') : '';
$targetDir = realpath($baseDir . '/' . $currentPath);

if (!$targetDir || strpos($targetDir, $baseDir) !== 0) {
    die("Accès refusé.");
}

$files = scandir($targetDir);
$files = array_diff($files, array('.', '..'));

$dirs = [];
$regularFiles = [];

foreach ($files as $file) {
    if (is_dir($targetDir . '/' . $file)) {
        $dirs[] = $file;
    } else {
        $regularFiles[] = $file;
    }
}

natcasesort($dirs);
natcasesort($regularFiles);

$sortedFiles = array_merge($dirs, $regularFiles);

echo '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Explorateur - ' . htmlspecialchars($currentPath) . '</title>
    <style>
        body { font-family: sans-serif; background: #f9f9f9; padding: 30px; }
        h2 { margin-bottom: 20px; }
        ul { list-style: none; padding-left: 20px; }
        li { margin: 6px 0; }
        a { text-decoration: none; color: #333; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <h2>📁 Dossier : /' . htmlspecialchars($currentPath) . '</h2>';

if ($currentPath !== '') {
    $parentPath = dirname($currentPath);
    if ($parentPath === '.' || $parentPath === '/') {
        $parentPath = '';
    }
    $parentLink = $parentPath === '' ? 'index.php' : '?path=' . urlencode($parentPath);
    echo '<p><a href="' . htmlspecialchars($parentLink) . '">⬅ Revenir en arrière</a></p>';
}

echo '<ul>';

foreach ($sortedFiles as $file) {
    $fullPath = $targetDir . '/' . $file;
    $isDir = is_dir($fullPath);
    $displayName = $file . ($isDir ? '/' : '');
    $icon = getIcon($fullPath);
    $arrow = $isDir ? '↳ ' : '- ';
    $link = $isDir
        ? '?path=' . urlencode(trim($currentPath . '/' . $file, '/'))
        : ($currentPath !== '' ? $currentPath . '/' . $file : $file);

    echo '<li>' . $arrow . '<a href="' . htmlspecialchars($link) . '">' . $icon . ' ' . htmlspecialchars($displayName) . '</a></li>';
}

echo '</ul>
</body>
</html>';
?>
