export function extractBrand(rotulo) {
  if (!rotulo) return 'Desconocida';
  
  const brandPatterns = [
    'REPSOL', 'CEPSA', 'BP', 'SHELL', 'GALP', 'PETROLIBER',
    'VALCARCE', 'MEROIL', 'BALLIENOIL', 'ALCAM', 'AVIA',
    'PLENERGY', 'LOW COST', 'INTERMAS', 'SOLRED', 'BILBAO BIODIESEL',
    'CARCHENAL', 'PETROMANAGER', 'OIL', 'PETRO', 'GAS',
    'E.S.', 'ESTACION', 'ESTACIO'
  ];
  
  const upperRotulo = rotulo.toUpperCase();
  
  for (const pattern of brandPatterns) {
    if (upperRotulo.includes(pattern)) {
      return pattern;
    }
  }
  
  const words = rotulo.split(' ');
  if (words.length > 0 && words[0].length <= 15) {
    return words[0];
  }
  
  return rotulo.substring(0, 20);
}
