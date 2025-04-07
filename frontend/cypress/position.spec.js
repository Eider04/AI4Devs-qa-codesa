describe('Position Interface Tests', () => {
  beforeEach(() => {
    // Interceptar la llamada al API para obtener el flujo de entrevistas
    cy.intercept('GET', 'http://localhost:3010/positions/*/interviewFlow', {
      fixture: 'interviewFlow.json'
    }).as('getInterviewFlow');

    // Interceptar la llamada al API para obtener los candidatos
    cy.intercept('GET', 'http://localhost:3010/positions/*/candidates', {
      fixture: 'candidates.json'
    }).as('getCandidates');

    // Visitar la página de posición
    cy.visit('http://localhost:3000/positions/1');
  });

  describe('Carga inicial de la página', () => {
    it('debería mostrar el título de la posición', () => {
      cy.wait('@getInterviewFlow');
      cy.get('h2').should('be.visible').and('contain', 'Desarrollador Frontend');
    });

    it('debería mostrar todas las columnas de fases', () => {
      cy.wait('@getInterviewFlow');
      cy.get('.row > div').should('have.length', 3); // Asumiendo 3 fases
      cy.get('.row > div').eq(0).should('contain', 'Aplicación recibida');
      cy.get('.row > div').eq(1).should('contain', 'Entrevista técnica');
      cy.get('.row > div').eq(2).should('contain', 'Decisión final');
    });

    it('debería mostrar las tarjetas de candidatos en sus columnas correctas', () => {
      cy.wait(['@getInterviewFlow', '@getCandidates']);
      cy.get('[data-testid="stage-column-1"]').find('[data-testid="candidate-card"]').should('have.length.at.least', 1);
    });
  });

  describe('Cambio de fase de un candidato', () => {
    it('debería permitir arrastrar un candidato a otra fase', () => {
      cy.wait(['@getInterviewFlow', '@getCandidates']);
      
      // Interceptar la llamada PUT que se realizará al mover el candidato
      cy.intercept('PUT', 'http://localhost:3010/candidates/*', {
        statusCode: 200,
        body: { success: true }
      }).as('updateCandidate');

      // Obtener la primera tarjeta y simular drag & drop
      cy.get('[data-testid="candidate-card"]').first().as('sourceCard');
      cy.get('[data-testid="stage-column-2"]').as('targetColumn');

      // Simular el drag & drop
      cy.get('@sourceCard')
        .drag('@targetColumn');

      // Verificar que se realizó la llamada al API
      cy.wait('@updateCandidate').its('request.body').should('deep.equal', {
        applicationId: 1,
        currentInterviewStep: 2
      });

      // Verificar que la tarjeta aparece en la nueva columna
      cy.get('[data-testid="stage-column-2"]')
        .find('[data-testid="candidate-card"]')
        .should('exist');
    });
  });
});