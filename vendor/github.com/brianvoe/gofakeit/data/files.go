package data

// Files consists of file information
var Files = map[string][]string{
	"mime_type": {"x-world/x-3dmf", "application/octet-stream", "application/x-authorware-bin", "application/x-authorware-map", "application/x-authorware-seg", "text/vnd.abc", "text/html", "video/animaflex", "application/postscript", "audio/aiff", "audio/x-aiff", "audio/aiff", "audio/x-aiff", "audio/aiff", "audio/x-aiff", "application/x-aim", "text/x-audiosoft-intra", "application/x-navi-animation", "application/x-nokia-9000-communicator-add-on-software", "application/mime", "application/octet-stream", "application/arj", "application/octet-stream", "image/x-jg", "video/x-ms-asf", "text/x-asm", "text/asp", "application/x-mplayer2", "video/x-ms-asf", "video/x-ms-asf-plugin", "audio/basic", "audio/x-au", "application/x-troff-msvideo", "video/avi", "video/msvideo", "video/x-msvideo", "video/avs-video", "application/x-bcpio", "application/mac-binary", "application/macbinary", "application/octet-stream", "application/x-binary", "application/x-macbinary", "image/bmp", "image/bmp", "image/x-windows-bmp", "application/book", "application/book", "application/x-bzip2", "application/x-bsh", "application/x-bzip", "application/x-bzip2", "text/plain", "text/x-c", "text/plain", "application/vnd.ms-pki.seccat", "text/plain", "text/x-c", "application/clariscad", "application/x-cocoa", "application/cdf", "application/x-cdf", "application/x-netcdf", "application/pkix-cert", "application/x-x509-ca-cert", "application/x-chat", "application/x-chat", "application/java", "application/java-byte-code", "application/x-java-class", "application/octet-stream", "text/plain", "text/plain", "application/x-cpio", "text/x-c", "application/mac-compactpro", "application/x-compactpro", "application/x-cpt", "application/pkcs-crl", "application/pkix-crl", "application/pkix-cert", "application/x-x509-ca-cert", "application/x-x509-user-cert", "application/x-csh", "text/x-script.csh", "application/x-pointplus", "text/css", "text/plain", "application/x-director", "application/x-deepv", "text/plain", "application/x-x509-ca-cert", "video/x-dv", "application/x-director", "video/dl", "video/x-dl", "application/msword", "application/msword", "application/commonground", "application/drafting", "application/octet-stream", "video/x-dv", "application/x-dvi", "drawing/x-dwf (old)", "model/vnd.dwf", "application/acad", "image/vnd.dwg", "image/x-dwg", "application/dxf", "image/vnd.dwg", "image/x-dwg", "application/x-director", "text/x-script.elisp", "application/x-bytecode.elisp (compiled elisp)", "application/x-elc", "application/x-envoy", "application/postscript", "application/x-esrehber", "text/x-setext", "application/envoy", "application/x-envoy", "application/octet-stream", "text/plain", "text/x-fortran", "text/x-fortran", "text/plain", "text/x-fortran", "application/vnd.fdf", "application/fractals", "image/fif", "video/fli", "video/x-fli", "image/florian", "text/vnd.fmi.flexstor", "video/x-atomic3d-feature", "text/plain", "text/x-fortran", "image/vnd.fpx", "image/vnd.net-fpx", "application/freeloader", "audio/make", "text/plain", "image/g3fax", "image/gif", "video/gl", "video/x-gl", "audio/x-gsm", "audio/x-gsm", "application/x-gsp", "application/x-gss", "application/x-gtar", "application/x-compressed", "application/x-gzip", "application/x-gzip", "multipart/x-gzip", "text/plain", "text/x-h", "application/x-hdf", "application/x-helpfile", "application/vnd.hp-hpgl", "text/plain", "text/x-h", "text/x-script", "application/hlp", "application/x-helpfile", "application/x-winhelp", "application/vnd.hp-hpgl", "application/vnd.hp-hpgl", "application/binhex", "application/binhex4", "application/mac-binhex", "application/mac-binhex40", "application/x-binhex40", "application/x-mac-binhex40", "application/hta", "text/x-component", "text/html", "text/html", "text/html", "text/webviewhtml", "text/html", "x-conference/x-cooltalk", "image/x-icon", "text/plain", "image/ief", "image/ief", "application/iges", "model/iges", "application/iges", "model/iges", "application/x-ima", "application/x-httpd-imap", "application/inf", "application/x-internett-signup", "application/x-ip2", "video/x-isvideo", "audio/it", "application/x-inventor", "i-world/i-vrml", "application/x-livescreen", "audio/x-jam", "text/plain", "text/x-java-source", "text/plain", "text/x-java-source", "application/x-java-commerce", "image/jpeg", "image/pjpeg", "image/jpeg", "image/jpeg", "image/pjpeg", "image/jpeg", "image/pjpeg", "image/jpeg", "image/pjpeg", "image/x-jps", "application/x-javascript", "image/jutvision", "audio/midi", "music/x-karaoke", "application/x-ksh", "text/x-script.ksh", "audio/nspaudio", "audio/x-nspaudio", "audio/x-liveaudio", "application/x-latex", "application/lha", "application/octet-stream", "application/x-lha", "application/octet-stream", "text/plain", "audio/nspaudio", "audio/x-nspaudio", "text/plain", "application/x-lisp", "text/x-script.lisp", "text/plain", "text/x-la-asf", "application/x-latex", "application/octet-stream", "application/x-lzh", "application/lzx", "application/octet-stream", "application/x-lzx", "text/plain", "text/x-m", "video/mpeg", "audio/mpeg", "video/mpeg", "audio/x-mpequrl", "application/x-troff-man", "application/x-navimap", "text/plain", "application/mbedlet", "application/mcad", "application/x-mathcad", "image/vasa", "text/mcf", "application/netmc", "application/x-troff-me", "message/rfc822", "message/rfc822", "application/x-midi", "audio/midi", "audio/x-mid", "audio/x-midi", "music/crescendo", "x-music/x-midi", "application/x-midi", "audio/midi", "audio/x-mid", "audio/x-midi", "music/crescendo", "x-music/x-midi", "application/x-frame", "application/x-mif", "message/rfc822", "www/mime", "video/x-motion-jpeg", "application/base64", "application/x-meme", "application/base64", "audio/mod", "audio/x-mod", "video/quicktime", "video/quicktime", "video/x-sgi-movie", "audio/mpeg", "audio/x-mpeg", "video/mpeg", "video/x-mpeg", "video/x-mpeq2a", "audio/mpeg3", "audio/x-mpeg-3", "video/mpeg", "video/x-mpeg", "audio/mpeg", "video/mpeg", "application/x-project", "video/mpeg", "video/mpeg", "audio/mpeg", "video/mpeg", "audio/mpeg", "application/vnd.ms-project", "application/x-project", "application/x-project", "application/x-project", "application/marc", "application/x-troff-ms", "video/x-sgi-movie", "audio/make", "application/x-vnd.audioexplosion.mzz", "image/naplps", "image/naplps", "application/x-netcdf", "application/vnd.nokia.configuration-message", "image/x-niff", "image/x-niff", "application/x-mix-transfer", "application/x-conference", "application/x-navidoc", "application/octet-stream", "application/oda", "application/x-omc", "application/x-omcdatamaker", "application/x-omcregerator", "text/x-pascal", "application/pkcs10", "application/x-pkcs10", "application/pkcs-12", "application/x-pkcs12", "application/x-pkcs7-signature", "application/pkcs7-mime", "application/x-pkcs7-mime", "application/pkcs7-mime", "application/x-pkcs7-mime", "application/x-pkcs7-certreqresp", "application/pkcs7-signature", "application/pro_eng", "text/pascal", "image/x-portable-bitmap", "application/vnd.hp-pcl", "application/x-pcl", "image/x-pict", "image/x-pcx", "chemical/x-pdb", "application/pdf", "audio/make", "audio/make.my.funk", "image/x-portable-graymap", "image/x-portable-greymap", "image/pict", "image/pict", "application/x-newton-compatible-pkg", "application/vnd.ms-pki.pko", "text/plain", "text/x-script.perl", "application/x-pixclscript", "image/x-xpixmap", "text/x-script.perl-module", "application/x-pagemaker", "application/x-pagemaker", "image/png", "application/x-portable-anymap", "image/x-portable-anymap", "application/mspowerpoint", "application/vnd.ms-powerpoint", "model/x-pov", "application/vnd.ms-powerpoint", "image/x-portable-pixmap", "application/mspowerpoint", "application/vnd.ms-powerpoint", "application/mspowerpoint", "application/powerpoint", "application/vnd.ms-powerpoint", "application/x-mspowerpoint", "application/mspowerpoint", "application/x-freelance", "application/pro_eng", "application/postscript", "application/octet-stream", "paleovu/x-pv", "application/vnd.ms-powerpoint", "text/x-script.phyton", "application/x-bytecode.python", "audio/vnd.qcelp", "x-world/x-3dmf", "x-world/x-3dmf", "image/x-quicktime", "video/quicktime", "video/x-qtc", "image/x-quicktime", "image/x-quicktime", "audio/x-pn-realaudio", "audio/x-pn-realaudio-plugin", "audio/x-realaudio", "audio/x-pn-realaudio", "application/x-cmu-raster", "image/cmu-raster", "image/x-cmu-raster", "image/cmu-raster", "text/x-script.rexx", "image/vnd.rn-realflash", "image/x-rgb", "application/vnd.rn-realmedia", "audio/x-pn-realaudio", "audio/mid", "audio/x-pn-realaudio", "audio/x-pn-realaudio", "audio/x-pn-realaudio-plugin", "application/ringing-tones", "application/vnd.nokia.ringing-tone", "application/vnd.rn-realplayer", "application/x-troff", "image/vnd.rn-realpix", "audio/x-pn-realaudio-plugin", "text/richtext", "text/vnd.rn-realtext", "application/rtf", "application/x-rtf", "text/richtext", "application/rtf", "text/richtext", "video/vnd.rn-realvideo", "text/x-asm", "audio/s3m", "application/octet-stream", "application/x-tbook", "application/x-lotusscreencam", "text/x-script.guile", "text/x-script.scheme", "video/x-scm", "text/plain", "application/sdp", "application/x-sdp", "application/sounder", "application/sea", "application/x-sea", "application/set", "text/sgml", "text/x-sgml", "text/sgml", "text/x-sgml", "application/x-bsh", "application/x-sh", "application/x-shar", "text/x-script.sh", "application/x-bsh", "application/x-shar", "text/html", "text/x-server-parsed-html", "audio/x-psid", "application/x-sit", "application/x-stuffit", "application/x-koan", "application/x-koan", "application/x-koan", "application/x-koan", "application/x-seelogo", "application/smil", "application/smil", "audio/basic", "audio/x-adpcm", "application/solids", "application/x-pkcs7-certificates", "text/x-speech", "application/futuresplash", "application/x-sprite", "application/x-sprite", "application/x-wais-source", "text/x-server-parsed-html", "application/streamingmedia", "application/vnd.ms-pki.certstore", "application/step", "application/sla", "application/vnd.ms-pki.stl", "application/x-navistyle", "application/step", "application/x-sv4cpio", "application/x-sv4crc", "image/vnd.dwg", "image/x-dwg", "application/x-world", "x-world/x-svr", "application/x-shockwave-flash", "application/x-troff", "text/x-speech", "application/x-tar", "application/toolbook", "application/x-tbook", "application/x-tcl", "text/x-script.tcl", "text/x-script.tcsh", "application/x-tex", "application/x-texinfo", "application/x-texinfo", "application/plain", "text/plain", "application/gnutar", "application/x-compressed", "image/tiff", "image/x-tiff", "image/tiff", "image/x-tiff", "application/x-troff", "audio/tsp-audio", "application/dsptype", "audio/tsplayer", "text/tab-separated-values", "image/florian", "text/plain", "text/x-uil", "text/uri-list", "text/uri-list", "application/i-deas", "text/uri-list", "text/uri-list", "application/x-ustar", "multipart/x-ustar", "application/octet-stream", "text/x-uuencode", "text/x-uuencode", "application/x-cdlink", "text/x-vcalendar", "application/vda", "video/vdo", "application/groupwise", "video/vivo", "video/vnd.vivo", "video/vivo", "video/vnd.vivo", "application/vocaltec-media-desc", "application/vocaltec-media-file", "audio/voc", "audio/x-voc", "video/vosaic", "audio/voxware", "audio/x-twinvq-plugin", "audio/x-twinvq", "audio/x-twinvq-plugin", "application/x-vrml", "model/vrml", "x-world/x-vrml", "x-world/x-vrt", "application/x-visio", "application/x-visio", "application/x-visio", "application/wordperfect6.0", "application/wordperfect6.1", "application/msword", "audio/wav", "audio/x-wav", "application/x-qpro", "image/vnd.wap.wbmp", "application/vnd.xara", "application/msword", "application/x-123", "windows/metafile", "text/vnd.wap.wml", "application/vnd.wap.wmlc", "text/vnd.wap.wmlscript", "application/vnd.wap.wmlscriptc", "application/msword", "application/wordperfect", "application/wordperfect", "application/wordperfect6.0", "application/wordperfect", "application/wordperfect", "application/x-wpwin", "application/x-lotus", "application/mswrite", "application/x-wri", "application/x-world", "model/vrml", "x-world/x-vrml", "model/vrml", "x-world/x-vrml", "text/scriplet", "application/x-wais-source", "application/x-wintalk", "image/x-xbitmap", "image/x-xbm", "image/xbm", "video/x-amt-demorun", "xgl/drawing", "image/vnd.xiff", "application/excel", "application/excel", "application/x-excel", "application/x-msexcel", "application/excel", "application/vnd.ms-excel", "application/x-excel", "application/excel", "application/vnd.ms-excel", "application/x-excel", "application/excel", "application/x-excel", "application/excel", "application/x-excel", "application/excel", "application/vnd.ms-excel", "application/x-excel", "application/excel", "application/vnd.ms-excel", "application/x-excel", "application/excel", "application/vnd.ms-excel", "application/x-excel", "application/x-msexcel", "application/excel", "application/x-excel", "application/excel", "application/x-excel", "application/excel", "application/vnd.ms-excel", "application/x-excel", "application/x-msexcel", "audio/xm", "application/xml", "text/xml", "xgl/movie", "application/x-vnd.ls-xpix", "image/x-xpixmap", "image/xpm", "image/png", "video/x-amt-showrun", "image/x-xwd", "image/x-xwindowdump", "chemical/x-pdb", "application/x-compress", "application/x-compressed", "application/x-compressed", "application/x-zip-compressed", "application/zip", "multipart/x-zip", "application/octet-stream", "text/x-script.zsh"},
	"extension": {"doc", "docx", "log", "msg", "odt", "pages", "rtf", "tex", "txt", "wpd", "wps", "csv", "dat", "gbr", "ged", "key", "keychain", "pps", "ppt", "pptx", "sdf", "tar", "vcf", "xml", "aif", "iff", "mid", "mpa", "ra", "wav", "wma", "asf", "asx", "avi", "flv", "mov", "mpg", "rm", "srt", "swf", "vob", "wmv", "max", "obj", "bmp", "dds", "gif", "jpg", "png", "psd", "pspimage", "tga", "thm", "tif", "tiff", "yuv", "ai", "eps", "ps", "svg", "indd", "pct", "pdf", "xlr", "xls", "xlsx", "accdb", "db", "dbf", "mdb", "pdb", "sql", "apk", "app", "bat", "cgi", "com", "exe", "gadget", "jar", "pif", "vb", "wsf", "dem", "gam", "nes", "rom", "sav", "dwg", "dxf", "gpx", "kml", "kmz", "asp", "aspx", "cer", "cfm", "csr", "css", "htm", "html", "js", "jsp", "php", "rss", "xhtml", "crx", "plugin", "fnt", "fon", "otf", "ttf", "cab", "cpl", "cur", "deskthemepack", "dll", "dmp", "drv", "icns", "ico", "lnk", "sys", "cfg", "ini", "prf", "hqx", "mim", "uue", "cbr", "deb", "gz", "pkg", "rar", "rpm", "sitx", "gz", "zip", "zipx", "bin", "cue", "dmg", "iso", "mdf", "toast", "vcd", "class", "cpp", "cs", "dtd", "fla", "java", "lua", "pl", "py", "sh", "sln", "swift", "vcxproj", "xcodeproj", "bak", "tmp", "crdownload", "ics", "msi", "part", "torrent"},
}
