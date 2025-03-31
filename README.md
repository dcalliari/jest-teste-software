# jest-teste-software

To install dependencies:

```bash
bun install
```

To run:

```bash
bun dev
```

This project was created using `bun init` in bun v1.1.38. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.

# Testes com Jest

## Como rodar os testes

Para executar os testes, use o comando:

```bash
bun test
```

## Cobertura de Código

Para gerar um relatório de cobertura de código, use:

```bash
bun test -- --coverage
```

O relatório será gerado na pasta `coverage/`. Ele mostra quais partes do código foram testadas e quais não foram.

---

# API de Usuários com Testes Automatizados

## Descrição da API
A API de Usuários foi desenvolvida utilizando o framework **Express.js** e fornece funcionalidades para gerenciar usuários. As principais rotas incluem:

- **CRUD de Usuários**: Criar, listar, buscar, atualizar e deletar usuários.
- **Autenticação**: Endpoint para autenticar usuários.
- **Perfil**: Endpoint para obter o perfil do usuário logado.
- **Documentação**: A API utiliza **Swagger** para gerar documentação interativa.

### Estrutura do Projeto
- **Rotas**: Definidas em `src/routes/userRoutes.ts`.
- **Controladores**: Implementados em `src/controllers/userController.ts`.
- **Middlewares**: Tratamento de erros em `src/middlewares/errorMiddleware.ts`.
- **Swagger**: Configuração em `src/swagger.ts`.

---

## Escolha do Jest para Testes
O **Jest** foi escolhido como framework de testes devido a:
- Suporte nativo para **TypeScript**.
- Facilidade de configuração e integração com bibliotecas como **Supertest**.
- Recursos avançados como mocks, spies e relatórios de cobertura de código.

---

## Testes Implementados

### Testes Unitários
Os testes unitários foram implementados para validar o comportamento isolado dos controladores da API. Eles estão localizados em `src/tests/unit/userController.test.ts`.

#### Implementação
- **Mocks**: Foram utilizados mocks para simular os objetos `Request` e `Response` do Express.
- **Cobertura**: Cada método do controlador foi testado individualmente.

#### O que foi testado:
- Respostas corretas para entradas válidas.
- Tratamento de erros para entradas inválidas.
- Mensagens de retorno e códigos de status HTTP.

#### Exemplo de Teste Unitário:
```typescript
it("Deve retornar mensagem de boas-vindas", () => {
	userController.getWelcome(mockRequest, mockResponse);
	expect(mockResponse.status).toHaveBeenCalledWith(200);
	expect(mockResponse.send).toHaveBeenCalledWith("Bem-vindo à API!");
});
```

### Testes de Integração
Os testes de integração foram implementados para validar a comunicação entre os componentes da API. Eles estão localizados em `src/tests/integration/userRoutes.test.ts`.

#### Implementação
- **Supertest**: Utilizado para simular requisições HTTP e validar as respostas.
- **Cobertura**: Testes abrangem todas as rotas da API, incluindo cenários de sucesso e erro.

#### O que foi validado:
- Comunicação entre rotas, middlewares e controladores.
- Respostas corretas para diferentes cenários.
- Tratamento de erros, como rotas inexistentes e entradas inválidas.

#### Exemplo de Teste de Integração:
```typescript
it("Deve criar um novo usuário", async () => {
	const response = await request(app)
		.post("/api/users")
		.send({ name: "Daniel", age: 30 });
	expect(response.status).toBe(201);
	expect(response.body).toEqual({
		message: "Usuário criado",
		user: { name: "Daniel", age: 30 },
	});
});
```

---

## Execução dos Testes

### Comandos
- **Executar todos os testes**:
  ```bash
  bun test
  ```
- **Gerar relatório de cobertura**:
  ```bash
  bun test -- --coverage
  ```

### Resultados
- **Cobertura de Código**: O relatório gerado na pasta `coverage/` mostrou alta cobertura para controladores e rotas.
- **Logs de Testes**: Todos os testes passaram com sucesso, validando o comportamento esperado da API.

---

## Desafios e Soluções

### Desafios:
1. **Mock de Objetos do Express**:
   - **Solução**: Uso de mocks personalizados para simular `Request` e `Response`.

2. **Validação de Entradas**:
   - **Solução**: Implementação de cenários de erro nos testes para garantir que entradas inválidas fossem tratadas corretamente.

3. **Cobertura de Código**:
   - **Solução**: Revisão dos testes para incluir cenários negligenciados.

---

## Conclusão
A API foi testada de forma abrangente, garantindo sua confiabilidade e robustez. O uso do Jest, combinado com boas práticas de testes unitários e de integração, permitiu validar a comunicação entre os componentes e o tratamento de erros.
