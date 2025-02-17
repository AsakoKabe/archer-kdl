import 'terminals'

// Diagram definition
KDLDiagram:
    'kdlDiagram' ':' 
        INDENT
            'id' ':' id=ID
            ('name' ':'  name=STRING)
            (
                'clusters' ':' 
                INDENT
                    (LIST_ITEM clusters+=ClusterNode)+
                DEDENT
            )?

            (
                'diagram' ':' 
                INDENT
                    diagram=Diagram
                DEDENT
            )?
        DEDENT
;

Diagram:
    (
        'nodeAttributes' ':' 
        INDENT
            (LIST_ITEM nodeAttributes+=NodeAttribute)+
        DEDENT
    )?
    (
        'edgeAttributes' ':' 
        INDENT
            (LIST_ITEM edgeAttributes+=EdgeAttribute)+
        DEDENT
    )?

;

ClusterNode:
    'id' ':' id=ID
    'name' ':'  name=STRING
    (
        (
            'ingresses' ':'
            INDENT 
                (LIST_ITEM ingresses+=IngressNode)+
            DEDENT
        ) &
        (
            'services' ':'
            INDENT 
                (LIST_ITEM services+=ServiceNode)+
            DEDENT
        ) & 
        (
            'pods' ':'
            INDENT 
                (LIST_ITEM pods+=PodNode)+
            DEDENT
        )
    )?
;

IngressNode:
    'id' ':' id=ID
    'name' ':' name=STRING
    'host' ':' host=STRING
    (
        (
            'links' ':'
            INDENT 
                (LIST_ITEM links+=[PortNode:IDReference])+
            DEDENT
        )
    )?
;

ContainerNode:
    'id' ':' id=ID
    'name' ':' name=STRING
    (
        (
            'links' ':'
            INDENT 
                (LIST_ITEM links+=[PortNode:IDReference])+
            DEDENT
        )
    )?
;

PortNode:
    'id' ':' id=ID
    'name' ':' name=STRING
    'number' ':' number=NUMBER
;

PodNode:
    'id' ':' id=ID
    'name' ':' name=STRING
    (
        'controller' ':' 
        INDENT
            controller=PodController
        DEDENT
    )?
    (
        'cardinality' ':' 
        INDENT
            cardinality=PodCardinality
        DEDENT
    )?
    
    (
        (
            'volumes' ':'
            INDENT 
                (LIST_ITEM volumes+=VolumeNode)+
            DEDENT
        ) &
        (
            'containers' ':'
            INDENT 
                (LIST_ITEM containers+=ContainerNode)+
            DEDENT
        ) &
        (
            'ports' ':'
            INDENT 
                (LIST_ITEM ports+=PortNode)+
            DEDENT
        )
    )?
;

PodController:
    'id' ':' id=ID
    'name' ':' name=STRING 
;

PodCardinality:
    'id' ':' id=ID
    'name' ':' name=STRING 
;

VolumeNode:
    'id' ':' id=ID
    (
        'name' ':' name=STRING &
        'type' ':' type=STRING 
    )
;

ServiceNode:
    'id' ':' id=ID
    'name' ':' name=STRING 
    (
        'type' ':' 
        INDENT
            type=ServiceTypeNode
        DEDENT
    )?
    (
        (
            'ports' ':'
            INDENT 
                (LIST_ITEM ports+=PortNode)+
            DEDENT
        ) &
        (
            'links' ':'
            INDENT 
                (LIST_ITEM links+=[PortNode:IDReference])+
            DEDENT
        )
    )?
;

ServiceTypeNode:
    'id' ':' id=ID
    'name' ':' name=STRING
;

NodeType:
    ClusterNode | IngressNode | ServiceNode | PodNode | ContainerNode | PortNode | ServiceTypeNode | PodController | PodCardinality | VolumeNode
;

SourceNodeType:
    IngressNode | ServiceNode | ContainerNode 
;

TargetNodeType:
    PortNode
;


Dimensions:
    ('x' ':' x=NUMBER) &
    ('y' ':' y=NUMBER) &
    ('width' ':' width=NUMBER) & 
    ('height' ':' height=NUMBER)
;

NodeAttribute:
    'id' ':' id=ID
    'nodeID' ':' nodeID=[NodeType:IDReference]
    (
        'dimensions' ':' 
        INDENT 
            dimensions=Dimensions
        DEDENT
    )
;

Point:
    'x' ':' x=NUMBER
    'y' ':' y=NUMBER
;

EdgeAttribute:
    'id' ':' id=ID
    'sourceID' ':' sourceID=[SourceNodeType:IDReference]
    'targetID' ':' targetID=[TargetNodeType:IDReference]
    (
        'points' ':'
        INDENT 
            (LIST_ITEM points+=Point)+
        DEDENT
    )?
;
    