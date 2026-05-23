<?php
// Masquer le nom du script en cours (par exemple, index.php)
// Ceci est nécessaire pour l'étape de masquage
$scriptName = basename($_SERVER['SCRIPT_NAME']);

function getIcon($fullPath) {
    $ext = strtolower(pathinfo($fullPath, PATHINFO_EXTENSION));
    
    // Dossiers
    if (is_dir($fullPath)) return "📁";
    
    // Langages Web & Programmation
    if ($ext === "apk") return "🤖"; 
    if ($ext === "php") return "🐘"; // PHP Elephant
    if ($ext === "html" || $ext === "htm") return "🌐"; // HTML Global
    if ($ext === "js") return "⚙️"; // JavaScript Gear
    if ($ext === "css") return "🎨"; // CSS Palette
    if ($ext === "py") return "🐍"; // Python Snake
    if (in_array($ext, ["c", "cpp", "h", "hpp"])) return "🧱"; // C/C++ Bricks
    if (in_array($ext, ["java", "jar"])) return "☕"; // Java Coffee
    if (in_array($ext, ["sh", "bash"])) return "🐚"; // Shell
    
    // Images & Médias
    if (in_array($ext, ["png", "jpg", "jpeg", "gif", "webp", "ico", "svg"])) return "🖼️"; // Images
    if (in_array($ext, ["mp4", "webm", "mov"])) return "🎬"; // Vidéo
    if (in_array($ext, ["mp3", "wav", "ogg"])) return "🎵"; // Audio
    
    // Documents & Données
    if (in_array($ext, ["json", "xml", "yml"])) return "💾"; // Data Storage
    if (in_array($ext, ["txt", "md", "log"])) return "📝"; // Text/Markdown
    if (in_array($ext, ["doc", "docx", "odt"])) return "📰"; // Word Docs
    if (in_array($ext, ["xls", "xlsx", "csv"])) return "📊"; // Spreadsheets
    if (in_array($ext, ["pdf"])) return "📕"; // PDF Book
    
    // Archives & Compression
    if (in_array($ext, ["zip", "rar", "7z", "tar", "gz"])) return "📦"; // Archive Box
    
    // Fichier Générique par défaut
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

foreach ($files as $file) {
    // 🛑 Étape de masquage : Si nous sommes dans le répertoire racine ET que le fichier correspond au nom du script (index.php)
    if ($currentPath === '' && $file === $scriptName) {
        continue; // Passer au fichier suivant
    }

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