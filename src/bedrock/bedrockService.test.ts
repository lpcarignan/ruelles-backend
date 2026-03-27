import { BedrockService } from "./bedrockService"

describe("BedrockService test suite", () => {

    it("processQuery() - should pass", async () => {
        const service = new BedrockService();

        const actual = await service.processQuery("Trouves-moi l'ancien numéro de lot pour le lot 1569269.");
        expect(actual).not.toEqual("");
    }, 30000)
})