grammar KDL

import 'entity'
import 'relationship'
import 'system-diagram'
import 'mapping'
import 'kdl-diagram'

entry KDLRoot:
    (entity=Entity | 
    relationship=Relationship | 
    systemDiagram=SystemDiagram |
    kdlDiagram=KDLDiagram |
    mapping=Mapping)?;
