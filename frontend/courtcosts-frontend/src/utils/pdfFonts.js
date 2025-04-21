// вместо двух отдельных импортов
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

// подключаем виртуальную файловую систему шрифтов
pdfMake.vfs = pdfFonts.pdfMake.vfs;


export default pdfMake;
