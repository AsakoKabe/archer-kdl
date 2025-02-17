import {
    AbstractLayoutOptions,
    Dimension,
    FreeFormLayouter,
    GParentElement,
    LayoutContainer,
    StatefulLayouter
} from '@eclipse-glsp/client';
import { injectable } from 'inversify';

@injectable()
export class FreeFormChildless extends FreeFormLayouter {
    static override KIND = 'freeFormChildless';

    protected override getChildrenSize(
        container: GParentElement & LayoutContainer,
        containerOptions: AbstractLayoutOptions,
        layouter: StatefulLayouter
    ): Dimension {
        return {
            width: 0,
            height: 0
        };
    }
}
