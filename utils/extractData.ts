import pdfParse from "pdf-parse";
import xlsx from "xlsx";
import Tesseract from "tesseract.js"; // Importando o Tesseract.js

export const extractDataFromPDF = async (buffer: Buffer) => {
    const data = await pdfParse(buffer);
    return { text: data.text };
}

export const extractDataFromImage = async (buffer: Buffer) => {
    // Usando Tesseract.js para extrair texto da imagem sem redimensionamento
    const { data: { text } } = await Tesseract.recognize(
        buffer, // Passa o buffer da imagem diretamente
        'por', // Certifique-se de que o idioma está correto
        {
            logger: info => console.log(info), // Log para acompanhar o progresso
        }
    );

    // Verifica se o texto extraído não está vazio
    if (!text || text.trim() === '') {
        console.error('Texto extraído da imagem está vazio');
        throw new Error('Texto extraído da imagem está vazio');
    }

    return { text }; // Retorna o texto extraído
}
// // Função para salvar os dados em um arquivo Excel
// export const saveDataToExcel = (data: any[], filePath: string) => { // Garantir que 'data' seja um array
//     const wb = xlsx.utils.book_new();
//     const ws = xlsx.utils.json_to_sheet(data); // Usar json_to_sheet para converter objetos em linhas
//     xlsx.utils.book_append_sheet(wb, ws, "Dados Extraídos");
//     xlsx.writeFile(wb, filePath); // Salvar o arquivo Excel
// }

// // Função para formatar o texto a ser enviado para a IA
// export const formatTextForAI = (extractedData: any) => {
//     return extractedData.map((item: any) => {
//         return `Nome: ${item.nome}, Idade: ${item.idade}, Email: ${item.email}`;
//     }).join('\n'); // Juntar os dados em uma string formatada
// }

