import { applyDecorators } from "@nestjs/common";
import { ApiOkResponse, getSchemaPath } from "@nestjs/swagger";

export class PaginatedDto<T> {
    data: T[];
    page: number;
    nextPage: number;
    hasNextPage: boolean;
}

export const ApiOkResponsePaginated = (model: any) =>
    applyDecorators(
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