import { NextApiRequest, NextApiResponse } from 'next';
import multer from 'multer';
import { extractDataFromPDF, extractDataFromImage } from '../../../utils/extractData';
import xlsx from "xlsx";

const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=AIzaSyAbIeH6ozUKv_GemlZSKmJsITLq8g8FHBQ';

const upload = multer({ storage: multer.memoryStorage() });

export const config = {
  api: {
    bodyParser: false,
  },
};

interface CustomRequest extends NextApiRequest {
  file?: Express.Multer.File;
}

const handler = async (req: CustomRequest, res: NextApiResponse) => {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Processa o upload do arquivo
    await new Promise((resolve, reject) => {
      upload.single('file')(req as any, {} as any, (error) => {
        if (error) return reject(error);
        resolve(true);
      });
    });

    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    let extractedData;

    // Verifica o tipo de arquivo e processa
    if (file.mimetype === 'application/pdf') {
      extractedData = await extractDataFromPDF(file.buffer);
    } else if (file.mimetype.startsWith('image/')) {
      extractedData = await extractDataFromImage(file.buffer);
    } else {
      return res.status(400).json({ error: 'Invalid file type' });
    }

    // Verifica se os dados foram extraídos corretamente
    console.log("Texto extraído:", extractedData.text); // Log do texto extraído
    if (!extractedData || !extractedData.text || extractedData.text.trim() === '') {
      console.error('Falha ao extrair texto da imagem');
      return res.status(500).json({ error: 'Failed to extract text from file' });
    }

    // Envia os dados extraídos para a API do Google
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `
                Analise o seguinte documento e retorne os dados em formato de array.
                Se o texto for corrido (apenas texto), separe cada célula por pontuação.
                Se for uma planilha, copie-a diretamente.
                Retorne apenas os dados, sem explicações adicionais

                Documento:
                ${extractedData.text}
            `
          }]
        }]
      }),
    });

    if (!response.ok) {
      console.log("Erro da api do google");
      return res.status(response.status).json({ error: 'Error from Google API' });
    }

    const googleData = await response.json();
    
    // ** Adicionando log para verificar os dados retornados pela IA **
    // console.log("Dados retornados pela IA:", googleData.candidates[0].content);
    console.log("Dados retornados pela IA:", googleData);

    // Extrai o texto da resposta da IA
    const aiText = googleData.candidates[0].content.parts[0].text;
    console.log("Texto retornado pela IA:", aiText); // Log do texto retornado pela IA

    // let worksheetData;
    // try {
    //   worksheetData = JSON.parse(aiText);
    // } catch {
    //   worksheetData = aiText.split('\n').map((line: any) => {
    //     return line.split(','); // Modificado para usar vírgula como delimitador
    //   });
    // }

    // // Ajuste para garantir que os dados sejam formatados corretamente
    // const formattedData = worksheetData.map((row: any) => {
    //   return { dados: row.join(', ') }; // Juntar todos os dados em uma única string
    // });

    // console.log("Dados formatados para Excel:", formattedData); // Log dos dados formatados

    // // Salva os dados em um arquivo Excel em memória
    // const wb = xlsx.utils.book_new();
    // const ws = xlsx.utils.json_to_sheet(formattedData);
    // xlsx.utils.book_append_sheet(wb, ws, "Dados Extraídos");
    
    // // Cria um buffer do arquivo Excel
    // const buffer = xlsx.write(wb, { bookType: 'xlsx', type: 'buffer' });

    // // Define os cabeçalhos para download
    // res.setHeader('Content-Disposition', 'attachment; filename="dados_extraidos.xlsx"');
    // res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
    // // Envia o arquivo Excel como resposta
    // res.send(buffer);

    // Aqui, em vez de salvar em Excel, retornamos o JSON diretamente
    res.status(200).json({ data: aiText }); // Retorna o resultado em formato JSON

  } catch (error) {
    console.error("Erro interno do servidor:", error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export default handler;
