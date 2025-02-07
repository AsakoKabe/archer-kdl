import 'terminals'

// Diagram definition
KDLDiagram:
    ('kdlDiagram' | 'diagram') ':' 
    INDENT
        'id' ':' id=ID &
        ('name' ':'  name=STRING)
        (
            (
                'clusters' ':'
                INDENT 
                    (LIST_ITEM clusters+=ClusterNode)+
                DEDENT
            ) &
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
            ) & 
            (
                'containers' ':'
                INDENT 
                    (LIST_ITEM containers+=ContainerNode)+
                DEDENT
            )
        )?
    DEDENT
;

Dimensions:
    ('x' ':' x=NUMBER) &
    ('y' ':' y=NUMBER) &
    ('width' ':' width=NUMBER) & 
    ('height' ':' height=NUMBER)
;

ClusterNode:
    'id' ':' id=ID
    'name' ':'  name=STRING
    (
        (
            'ingresses' ':'
            INDENT 
                (LIST_ITEM ingresses+=[IngressNode:IDReference])+
            DEDENT
        ) &
        (
            'services' ':'
            INDENT 
                (LIST_ITEM services+=[ServiceNode:IDReference])+
            DEDENT
        ) & 
        (
            'pods' ':'
            INDENT 
                (LIST_ITEM pods+=[PodNode:IDReference])+
            DEDENT
        ) &
        (
            'dimensions' ':' 
            INDENT 
                dimensions=Dimensions
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
        ) &
        (
            'dimensions' ':' 
            INDENT 
                dimensions=Dimensions
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
        ) &
        (
            'dimensions' ':' 
            INDENT 
                dimensions=Dimensions
            DEDENT
        )
    )?
;

PortNode:
    'id' ':' id=ID
    'name' ':' name=STRING
    'number' ':' number=NUMBER
    (
        'dimensions' ':' 
        INDENT 
            dimensions=Dimensions
        DEDENT
    )?
;

PodNode:
    'id' ':' id=ID
    'name' ':' name=STRING 
    (
        (
            'containers' ':'
            INDENT 
                (LIST_ITEM containers+=[ContainerNode:IDReference])+
            DEDENT
        ) &
        (
            'ports' ':'
            INDENT 
                (LIST_ITEM ports+=PortNode)+
            DEDENT
        ) &
        (
            'dimensions' ':' 
            INDENT 
                dimensions=Dimensions
            DEDENT
        )
    )?
;

ServiceNode:
    'id' ':' id=ID
    'name' ':' name=STRING 
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
        ) &
        (
            'dimensions' ':' 
            INDENT 
                dimensions=Dimensions
            DEDENT
        )
    )?
;
