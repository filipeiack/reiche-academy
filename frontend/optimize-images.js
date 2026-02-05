const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const optimizeImages = async () => {
  try {
    console.log('🚀 Otimizando imagens com Sharp...');
    
    // Ler diretório manualmente
    const imageDir = 'src/assets/images';
    const files = await fs.readdir(imageDir);
    
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png'].includes(ext);
    }).map(file => path.join(imageDir, file));
    
    // Criar pasta otimizada se não existir
    await fs.mkdir('src/assets/images/optimized', { recursive: true });
    
    console.log(`📁 Processando ${imageFiles.length} arquivos...\n`);
    
    let totalSaved = 0;
    
    for (const file of imageFiles) {
      const originalStats = await fs.stat(file);
      const originalSize = originalStats.size;
      const ext = path.extname(file).toLowerCase();
      const basename = path.basename(file, ext);
      
      console.log(`📄 ${path.basename(file)}`);
      console.log(`   Original: ${(originalSize / 1024).toFixed(1)}KB`);
      
      try {
        let optimizedBuffer;
        let outputPath;
        
        if (ext === '.png') {
          // PNG: Reduzir qualidade e remover metadata
          optimizedBuffer = await sharp(file)
            .png({ 
              quality: 85, 
              compressionLevel: 9,
              adaptiveFiltering: true
            })
            .toBuffer();
          
          outputPath = `src/assets/images/optimized/${basename}.png`;
        } else {
          // JPEG: Reduzir qualidade, converter para progressive
          optimizedBuffer = await sharp(file)
            .jpeg({ 
              quality: 85, 
              progressive: true,
              mozjpeg: true
            })
            .toBuffer();
          
          outputPath = `src/assets/images/optimized/${basename}.jpg`;
        }
        
        // Salvar imagem otimizada
        await fs.writeFile(outputPath, optimizedBuffer);
        
        const optimizedSize = optimizedBuffer.length;
        const savings = originalSize - optimizedSize;
        const savingsPercent = ((savings / originalSize) * 100).toFixed(1);
        totalSaved += savings;
        
        console.log(`   Otimizado: ${(optimizedSize / 1024).toFixed(1)}KB`);
        console.log(`   Economia: ${savingsPercent}% (${(savings / 1024).toFixed(1)}KB)\n`);
        
      } catch (error) {
        console.log(`   ❌ Erro: ${error.message}\n`);
      }
    }
    
    console.log(`✅ Otimização completa!`);
    console.log(`💾 Total economizado: ${(totalSaved / 1024).toFixed(1)}KB`);
    
  } catch (error) {
    console.error('❌ Erro ao otimizar imagens:', error);
  }
};

optimizeImages();