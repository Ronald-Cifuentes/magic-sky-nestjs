import { Scalar, CustomScalar } from '@nestjs/graphql';
import { Kind, ValueNode } from 'graphql';

@Scalar('JSON', () => Object)
export class JsonScalar implements CustomScalar<object, object> {
  description = 'JSON scalar type';

  parseValue(value: unknown): object {
    return value as object;
  }

  serialize(value: unknown): object {
    return value as object;
  }

  parseLiteral(ast: ValueNode): object {
    if (ast.kind === Kind.OBJECT) {
      const value: Record<string, unknown> = {};
      for (const field of ast.fields) {
        value[field.name.value] = this.parseLiteral(field.value);
      }
      return value;
    }
    if (ast.kind === Kind.LIST) {
      return ast.values.map((v) => this.parseLiteral(v)) as unknown as object;
    }
    if (ast.kind === Kind.STRING) return ast.value as unknown as object;
    if (ast.kind === Kind.INT || ast.kind === Kind.FLOAT) return Number(ast.value) as unknown as object;
    if (ast.kind === Kind.BOOLEAN) return ast.value as unknown as object;
    if (ast.kind === Kind.NULL) return null as unknown as object;
    return {};
  }
}
