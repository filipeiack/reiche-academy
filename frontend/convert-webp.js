const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const convertToWebP = async () => {
  try {
    console.log('🚀 Convertendo imagens para WebP...');
    
    // Ler diretório original
    const imageDir = 'src/assets/images';
    const files = await fs.readdir(imageDir);
    
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png'].includes(ext);
    }).map(file => path.join(imageDir, file));
    
    // Criar pasta WebP se não existir
    await fs.mkdir('src/assets/images/webp', { recursive: true });
    
    console.log(`📁 Convertendo ${imageFiles.length} arquivos...\n`);
    
    let totalSaved = 0;
    
    for (const file of imageFiles) {
      const originalStats = await fs.stat(file);
      const originalSize = originalStats.size;
      const basename = path.basename(file, path.extname(file));
      
      console.log(`📄 ${path.basename(file)}`);
      console.log(`   Original: ${(originalSize / 1024).toFixed(1)}KB`);
      
      try {
        // Converter para WebP com alta qualidade
        const webpBuffer = await sharp(file)
          .webp({ 
            quality: 85,
            method: 6, // máxima compressão
            effort: 6
          })
          .toBuffer();
        
        const webpPath = `src/assets/images/webp/${basename}.webp`;
        await fs.writeFile(webpPath, webpBuffer);
        
        const webpSize = webpBuffer.length;
        const savings = originalSize - webpSize;
        const savingsPercent = ((savings / originalSize) * 100).toFixed(1);
        totalSaved += savings;
        
        console.log(`   WebP: ${(webpSize / 1024).toFixed(1)}KB`);
        console.log(`   Economia: ${savingsPercent}% (${(savings / 1024).toFixed(1)}KB)\n`);
        
      } catch (error) {
        console.log(`   ❌ Erro: ${error.message}\n`);
      }
    }
    
    console.log(`✅ Conversão WebP completa!`);
    console.log(`💾 Total economizado: ${(totalSaved / 1024).toFixed(1)}KB`);
    
    // Gerar código HTML com picture tag para uso
    console.log(`\n📝 Exemplo de uso HTML:`);
    console.log(`<picture>
  <source srcset="/assets/images/webp/nome.webp" type="image/webp">
  <img src="/assets/images/nome.jpg" alt="Descrição">
</picture>`);
    
  } catch (error) {
    console.error('❌ Erro ao converter para WebP:', error);
  }
};

convertToWebP();