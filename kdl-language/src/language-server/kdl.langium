grammar KDL

import 'entity'
import 'relationship'
import 'system-diagram'
import 'mapping'

entry KDLRoot:
    (entity=Entity | 
    relationship=Relationship | 
    systemDiagram=SystemDiagram |
    mapping=Mapping)?;
