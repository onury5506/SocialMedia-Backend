import { Type, applyDecorators } from "@nestjs/common";
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from "@nestjs/swagger";

export class PaginatedDto<T> {
    data: T[];
    page: number;
    nextPage: number;
    hasNextPage: boolean;
}

export const ApiOkResponsePaginated = <DataDto extends Type<unknown>>(model: DataDto) =>
    applyDecorators(
        ApiExtraModels(PaginatedDto, model),
        ApiOkResponse({
            schema: {
                allOf: [
                    { $ref: getSchemaPath(PaginatedDto) },
                    {
                        properties: {
                            data: {
                                type: 'array',
                                items: { $ref: getSchemaPath(model) },
                            },
                            page : {
                                type: 'number',
                            },
                            nextPage : {
                                type: 'number',
                            },
                            hasNextPage : {
                                type: 'boolean',
                            }
                        },
                    },
                ],
            },
        })
    )