import Cors from 'cors';

// Inicializa o middleware CORS
const cors = Cors({
    methods: ['POST', 'GET', 'HEAD'], // Métodos permitidos
    origin: '*', // Permite qualquer origem
});

// Helper para executar o middleware
export function runMiddleware(req, res, fn) {
    return new Promise((resolve, reject) => {
        fn(req, res, (result) => {
            if (result instanceof Error) {
                return reject(result);
            }
            return resolve(result);
        });
    });
}

export default cors;
