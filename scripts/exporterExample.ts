import { generateReport } from '@/exporter/exporter.js'

// exporter usage example

const dataFull = [
  {
    betName: 'Aposta Completa 1',
    betUrl: 'https://aposta1.com',
    startDate: new Date(2024, 10, 1, 14, 0), // 1º de Novembro de 2024 às 14:00
    endDate: new Date(2024, 10, 15, 18, 0), // 15 de Novembro de 2024 às 18:00
    infos: [
      {
        advertence: 'símbolo "18+"',
        value: true,
        location: 'Topo da página',
        contrast: 'Alto',
        render: 'Correta',
      },
      {
        advertence: 'aviso "proibido para menores de 18 anos"',
        value: true,
        location: 'Cabeçalho',
        contrast: 'Alto',
        render: 'Correta',
      },
      {
        advertence: 'Jogue com responsabilidade',
        value: true,
        location: 'Rodapé',
        contrast: 'Médio',
        render: 'Adequada',
      },
      {
        advertence: 'Apostas são atividades com riscos de perdas financeiras.',
        value: true,
        location: 'Página principal',
        contrast: 'Alto',
        render: 'Excelente',
      },
      {
        advertence: 'Apostar pode levar à perda de dinheiro.',
        value: true,
        location: 'Seção de ajuda',
        contrast: 'Alto',
        render: 'Correta',
      },
      {
        advertence: 'As chances são de que você está prestes a perder',
        value: true,
        location: 'Banner lateral',
        contrast: 'Médio',
        render: 'Parcial',
      },
      {
        advertence: 'Aposta não é investimento.',
        value: true,
        location: 'Cabeçalho',
        contrast: 'Baixo',
        render: 'Adequada',
      },
      {
        advertence: 'Apostar pode causar dependência.',
        value: true,
        location: 'Seção de segurança',
        contrast: 'Alto',
        render: 'Correta',
      },
      {
        advertence: 'Apostas esportivas: pratique o jogo seguro.',
        value: true,
        location: 'Rodapé',
        contrast: 'Médio',
        render: 'Adequada',
      },
      {
        advertence: 'Apostar não deixa ninguém rico.',
        value: true,
        location: 'Centro da página',
        contrast: 'Médio',
        render: 'Parcial',
      },
      {
        advertence: 'Saiba quando apostar e quando parar.',
        value: true,
        location: 'Rodapé',
        contrast: 'Baixo',
        render: 'Adequada',
      },
      {
        advertence: 'Aposta é assunto para adultos.',
        value: true,
        location: 'Topo da página',
        contrast: 'Alto',
        render: 'Correta',
      },
    ],
  },
  {
    betName: 'Aposta Completa 2',
    betUrl: 'https://aposta2.com',
    startDate: new Date(2024, 11, 1, 10, 0), // 1º de Dezembro de 2024 às 10:00
    endDate: new Date(2024, 11, 15, 17, 0), // 15 de Dezembro de 2024 às 17:00
    infos: [
      // {
      //   advertence: 'símbolo "18+"',
      //   value: true,
      //   location: 'Rodapé',
      //   contrast: 'Médio',
      //   render: 'Adequada',
      // },
      // {
      //   advertence: 'aviso "proibido para menores de 18 anos"',
      //   value: true,
      //   location: 'Rodapé',
      //   contrast: 'Baixo',
      //   render: 'Parcial',
      // },
      {
        advertence: 'Jogue com responsabilidade',
        value: true,
        location: 'Seção de ajuda',
        contrast: 'Alto',
        render: 'Correta',
      },
      {
        advertence: 'Apostas são atividades com riscos de perdas financeiras.',
        value: true,
        location: 'Página principal',
        contrast: 'Médio',
        render: 'Adequada',
      },
      {
        advertence: 'Apostar pode levar à perda de dinheiro.',
        value: true,
        location: 'Topo da página',
        contrast: 'Alto',
        render: 'Excelente',
      },
      {
        advertence: 'As chances são de que você está prestes a perder',
        value: true,
        location: 'Banner lateral',
        contrast: 'Médio',
        render: 'Correta',
      },
      {
        advertence: 'Aposta não é investimento.',
        value: true,
        location: 'Seção de segurança',
        contrast: 'Alto',
        render: 'Adequada',
      },
      {
        advertence: 'Apostar pode causar dependência.',
        value: true,
        location: 'Cabeçalho',
        contrast: 'Baixo',
        render: 'Parcial',
      },
      {
        advertence: 'Apostas esportivas: pratique o jogo seguro.',
        value: true,
        location: 'Rodapé',
        contrast: 'Médio',
        render: 'Adequada',
      },
      {
        advertence: 'Apostar não deixa ninguém rico.',
        value: true,
        location: 'Centro da página',
        contrast: 'Médio',
        render: 'Parcial',
      },
      {
        advertence: 'Saiba quando apostar e quando parar.',
        value: true,
        location: 'Rodapé',
        contrast: 'Baixo',
        render: 'Adequada',
      },
      {
        advertence: 'Aposta é assunto para adultos.',
        value: true,
        location: 'Topo da página',
        contrast: 'DAWDYGAWIYGDAYGW',
        render: 'Correta',
      },
    ],
  },
]


generateReport(dataFull)
