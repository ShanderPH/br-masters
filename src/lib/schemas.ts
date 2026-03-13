import { z } from "zod";

export const loginByUsernameSchema = z.object({
  username: z
    .string()
    .min(1, "Nome de usuário é obrigatório")
    .max(100, "Nome de usuário muito longo"),
  password: z
    .string()
    .min(1, "Senha é obrigatória")
    .max(128, "Senha muito longa"),
});

export const loginByEmailSchema = z.object({
  email: z
    .string()
    .min(1, "E-mail é obrigatório")
    .email("Formato de e-mail inválido"),
  password: z
    .string()
    .min(1, "Senha é obrigatória")
    .max(128, "Senha muito longa"),
});

export const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(2, "Nome deve ter pelo menos 2 caracteres")
      .max(50, "Nome muito longo"),
    lastName: z
      .string()
      .min(2, "Sobrenome deve ter pelo menos 2 caracteres")
      .max(80, "Sobrenome muito longo"),
    email: z
      .string()
      .min(1, "E-mail é obrigatório")
      .email("Formato de e-mail inválido"),
    favoriteTeamId: z
      .string()
      .uuid("Selecione um time do coração válido"),
    whatsapp: z
      .string()
      .min(10, "WhatsApp é obrigatório"),
    cpf: z
      .string()
      .optional()
      .refine(
        (value) => !value || value.replace(/\D/g, "").length === 11,
        "CPF inválido"
      ),
    password: z
      .string()
      .min(6, "Senha deve ter pelo menos 6 caracteres")
      .max(128, "Senha muito longa")
      .regex(/[A-Z]/, "Senha deve conter pelo menos uma letra maiúscula")
      .regex(/[0-9]/, "Senha deve conter pelo menos um número"),
    confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  })
  .refine((data) => data.whatsapp.replace(/\D/g, "").length >= 10, {
    message: "WhatsApp inválido",
    path: ["whatsapp"],
  });

export const depositSchema = z.object({
  amount: z
    .number({ message: "Valor deve ser um número" })
    .positive("Valor deve ser maior que zero")
    .min(5, "Valor mínimo é R$ 5,00")
    .max(5000, "Valor máximo é R$ 5.000,00")
    .refine((val) => Number.isFinite(val), "Valor inválido"),
  category: z.enum(["tournament_prize", "round_prize", "match_prize"], {
    message: "Categoria de depósito inválida",
  }),
  paymentMethod: z.enum(["card", "pix"], {
    message: "Método de pagamento inválido",
  }),
});

export type LoginByUsernameInput = z.infer<typeof loginByUsernameSchema>;
export type LoginByEmailInput = z.infer<typeof loginByEmailSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type DepositInput = z.infer<typeof depositSchema>;
