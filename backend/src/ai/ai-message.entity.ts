import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  Generated,
} from 'typeorm';

export enum AiMessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
}

/**
 * Une ligne par message échangé, regroupée par (companyId, clientPhone).
 * clientPhone sert d'identifiant de conversation simple ; en pratique il
 * correspond soit à un numéro WhatsApp, soit à un identifiant de session
 * pour le widget de chat du site.
 */
@Entity('ai_messages')
@Index(['companyId', 'clientPhone'])
export class AiMessage {
  // Clé primaire auto-incrémentée : garantit un tri chronologique fiable
  // même pour des messages créés dans la même seconde (échanges rapides).
  @PrimaryGeneratedColumn()
  seq: number;

  @Column({ unique: true })
  @Generated('uuid')
  id: string;

  @Column()
  companyId: string;

  @Column()
  clientPhone: string;

  @Column({ type: 'varchar' })
  role: AiMessageRole;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn()
  createdAt: Date;
}
