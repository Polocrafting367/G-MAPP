<?php
declare(strict_types=1);

if (!isset($_FILES['zip_file']) || $_FILES['zip_file']['error'] !== UPLOAD_ERR_OK) {
    die('⚠️ Erreur upload ZIP.');
}

$zipName = $_FILES['zip_file']['tmp_name'];
$tempDir = __DIR__ . '/temp_json_clean';
$finalDir = __DIR__ . '/cleaned_json';

if (file_exists($tempDir)) {
    rrmdir($tempDir);
}
mkdir($tempDir, 0777, true);

if (file_exists($finalDir)) {
    rrmdir($finalDir);
}
mkdir($finalDir, 0777, true);

// Dézipper
$zip = new ZipArchive();
if ($zip->open($zipName) !== TRUE) {
    die('⚠️ Impossible d’ouvrir le ZIP.');
}
$zip->extractTo($tempDir);
$zip->close();

copyAndClean($tempDir, $finalDir);

rrmdir($tempDir);

echo "✅ Fichiers nettoyés et copiés dans <strong>cleaned_json</strong>.";

function copyAndClean(string $source, string $destination): void {
    $dir = opendir($source);
    @mkdir($destination);

    while (false !== ($file = readdir($dir))) {
        if ($file !== '.' && $file !== '..') {
            $srcPath = $source . '/' . $file;
            $destPath = $destination . '/' . $file;

            if (is_dir($srcPath)) {
                copyAndClean($srcPath, $destPath);
            } else {
if (strtolower(pathinfo($file, PATHINFO_EXTENSION)) === 'json') {
    $content = file_get_contents($srcPath);

    // Si c’est un JSON stringifié (entre guillemets)
if (isJsonStringified($content)) {
    $content = trim($content, "\"");
    $content = stripslashes($content);
}

// 💥 Protéger
$content = str_replace('\\', '€', $content);

// 💥 Déprotéger avant decode
$content = str_replace('€', '\\', $content);

$decoded = json_decode($content, true);

if ($decoded === null && is_string($content)) {
    file_put_contents($destPath, ensureUtf8($content));
} elseif (json_last_error() === JSON_ERROR_NONE) {
    $cleaned = cleanValues($decoded);

    $jsonPretty = json_encode($cleaned, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    file_put_contents($destPath, ensureUtf8($jsonPretty));
} else {
    file_put_contents($destPath, ensureUtf8($content));
}

}
 else {
                    copy($srcPath, $destPath);
                }
            }
        }
    }
    closedir($dir);
}

function cleanValues($data) {
    if (is_array($data)) {
        foreach ($data as $key => $value) {
            $data[$key] = cleanValues($value);
        }
    } elseif (is_string($data)) {
        $str = convertBrokenEmojiString($data);
        return $str;
    }
    return $data;
}



function isJsonStringified(string $str): bool {
    return substr($str, 0, 1) === "\"" && substr($str, -1) === "\"";
}

function decodeFullJsonString(string $str): string {
    // Déséchapper (strip slashes)
    $str = stripcslashes($str);

    // Ici on force à ce que \uXXXX soient transformés correctement en UTF-8
    $decoded = json_decode($str);
    if ($decoded !== null) {
        // Si c’est un tableau ou objet JSON valide, on réencode direct
        return json_encode($decoded, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
    return $str;
}
function decodeUnicodeEscapedString(string $str): string {
    $str = stripcslashes($str);
    $decoded = json_decode('"' . $str . '"');
    if ($decoded !== null) {
        return $decoded;
    }
    return $str;
}


function ensureUtf8(string $text): string {
    if (!mb_detect_encoding($text, 'UTF-8', true)) {
        return mb_convert_encoding($text, 'UTF-8');
    }
    return $text;
}


function autoFixUnicode(string $str): string {
    return preg_replace_callback('/(u[0-9a-fA-F]{4})+/', function ($matches) {
        $full = $matches[0];

        // On sépare en blocs de 5
        $blocks = str_split($full, 5);

        $fixed = '';
        foreach ($blocks as $block) {
            if (preg_match('/^u[0-9a-fA-F]{4}$/', $block)) {
                $fixed .= '\\' . $block;
            } else {
                $fixed .= $block; // On laisse tel quel si bloc foireux
            }
        }

        return $fixed;
    }, $str);
}

function rrmdir(string $dir): void {
    if (!is_dir($dir)) return;
    foreach (scandir($dir) as $object) {
        if ($object !== "." && $object !== "..") {
            $path = $dir . DIRECTORY_SEPARATOR . $object;
            if (is_dir($path)) {
                rrmdir($path);
            } else {
                unlink($path);
            }
        }
    }
    rmdir($dir);
}
function convertBrokenEmojiString(string $str): string {
    return preg_replace_callback('/(u[0-9a-fA-F]{4})+/', function ($matches) {
        $full = $matches[0];

        // Découpe en blocs de 5 caractères
        $blocks = str_split($full, 5);

        $new = '';
        foreach ($blocks as $block) {
            if (preg_match('/^u[0-9a-fA-F]{4}$/', $block)) {
                $new .= '\\' . $block;
            }
        }

        // Maintenant, décoder cette pseudo chaîne
        $decoded = json_decode('"' . $new . '"');
        return $decoded !== null ? $decoded : $full;
    }, $str);
}
